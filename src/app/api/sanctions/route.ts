import { NextResponse } from "next/server";
import {
  getSanctionsByDate,
  SANCTIONS_PACKAGES,
  SANCTIONS_SUMMARY,
  type SanctionsPackage,
  type SanctionsSummary,
} from "@/data/sanctions";
import { cacheGet, cacheSet, isFresh, isUsableStale } from "@/lib/cache";
import { fetchOFSISanctions } from "@/lib/ofsi";

// ---------------------------------------------------------------------------
// Cache config
// ---------------------------------------------------------------------------

const CACHE_KEY = "sanctions-live";
const TTL = 86400; // 24 hours
const MEM_TTL = TTL * 1000;

/** YYYYMM of the last static entry — anything after this is "new". */
const STATIC_CUTOFF = "202406";

// ---------------------------------------------------------------------------
// In-memory cache + concurrent-fetch dedup
// ---------------------------------------------------------------------------

interface SanctionsPayload {
  packages: SanctionsPackage[];
  summary: SanctionsSummary;
  source: { static: number; live: number; provider: string; listUpdated: string };
}

let cachedResult: SanctionsPayload | null = null;
let cachedAt = 0;
let inflightPromise: Promise<SanctionsPayload> | null = null;

// ---------------------------------------------------------------------------
// Merge & recompute
// ---------------------------------------------------------------------------

function buildSummary(
  packages: SanctionsPackage[],
  baseSummary: SanctionsSummary,
): SanctionsSummary {
  const byImposer: Record<string, number> = { ...baseSummary.byImposer };
  let totalIndividuals = baseSummary.totalIndividualsSanctioned;
  let totalEntities = baseSummary.totalEntitiesSanctioned;

  // Only account for live (non-static) packages
  for (const pkg of packages) {
    if (pkg.id.startsWith("uk-ofsi-")) {
      byImposer[pkg.imposedBy] = (byImposer[pkg.imposedBy] ?? 0) + 1;
      totalIndividuals += pkg.targets.individuals;
      totalEntities += pkg.targets.entities;
    }
  }

  return {
    totalPackages: packages.length,
    totalIndividualsSanctioned: totalIndividuals,
    totalEntitiesSanctioned: totalEntities,
    byImposer,
    keyBans: baseSummary.keyBans,
  };
}

function mergePackages(
  staticPkgs: SanctionsPackage[],
  livePkgs: SanctionsPackage[],
): SanctionsPackage[] {
  // Deduplicate: skip any live package whose date falls within 3 days of an
  // existing static package from the same imposer.
  const staticDates = new Set(staticPkgs.map((p) => `${p.imposedBy}:${p.date.slice(0, 6)}`));

  const unique = livePkgs.filter(
    (lp) => !staticDates.has(`${lp.imposedBy}:${lp.date.slice(0, 6)}`),
  );

  return [...staticPkgs, ...unique].sort((a, b) => a.date.localeCompare(b.date));
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function fetchLiveAndMerge(): Promise<SanctionsPayload> {
  const ofsi = await fetchOFSISanctions(STATIC_CUTOFF);

  const merged = mergePackages(SANCTIONS_PACKAGES, ofsi.packages);
  const summary = buildSummary(merged, SANCTIONS_SUMMARY);

  return {
    packages: merged,
    summary,
    source: {
      static: SANCTIONS_PACKAGES.length,
      live: ofsi.packages.length,
      provider: "UK OFSI Consolidated Sanctions List",
      listUpdated: ofsi.listUpdated,
    },
  };
}

async function fetchAndCache(): Promise<SanctionsPayload> {
  if (inflightPromise) return inflightPromise;
  inflightPromise = (async () => {
    const data = await fetchLiveAndMerge();
    cachedResult = data;
    cachedAt = Date.now();
    await cacheSet(CACHE_KEY, data, TTL);
    return data;
  })();
  try {
    return await inflightPromise;
  } finally {
    inflightPromise = null;
  }
}

function refreshInBackground() {
  if (inflightPromise) return;
  fetchAndCache().catch((err) => {
    console.error("[sanctions] Background refresh failed:", err);
  });
}

/** Static-only fallback (same shape as live response). */
function staticPayload(pkgs?: SanctionsPackage[]): SanctionsPayload {
  const packages = pkgs ?? SANCTIONS_PACKAGES;
  return {
    packages,
    summary: pkgs ? buildSummary(packages, SANCTIONS_SUMMARY) : SANCTIONS_SUMMARY,
    source: {
      static: packages.length,
      live: 0,
      provider: "static",
      listUpdated: "n/a",
    },
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

/**
 * GET /api/sanctions
 *
 * Returns curated + live sanctions data, cached for 24 h.
 *
 * Query params:
 *   - asOf (optional): YYYYMMDD — return only packages imposed on or before this date.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const asOf = searchParams.get("asOf");

  try {
    // ── Layer 1: in-memory cache ──────────────────────────────────────────
    const now = Date.now();
    if (cachedResult && now - cachedAt < MEM_TTL) {
      const payload = asOf
        ? { ...cachedResult, packages: cachedResult.packages.filter((p) => p.date <= asOf) }
        : cachedResult;
      return NextResponse.json(payload, {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
          "X-Cache": "HIT",
          "X-Data-Source": "memory",
        },
      });
    }

    // ── Layer 2: persistent cache ─────────────────────────────────────────
    const cached = await cacheGet<SanctionsPayload>(CACHE_KEY);

    if (cached && isFresh(cached)) {
      cachedResult = cached.data;
      cachedAt = cached.timestamp;
      const payload = asOf
        ? { ...cached.data, packages: cached.data.packages.filter((p) => p.date <= asOf) }
        : cached.data;
      return NextResponse.json(payload, {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
          "X-Cache": "HIT",
          "X-Data-Source": "cache",
        },
      });
    }

    if (cached && isUsableStale(cached)) {
      refreshInBackground();
      const payload = asOf
        ? { ...cached.data, packages: cached.data.packages.filter((p) => p.date <= asOf) }
        : cached.data;
      return NextResponse.json(payload, {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
          "X-Cache": "STALE",
          "X-Data-Source": "stale-cache",
        },
      });
    }

    // ── Layer 3: live fetch ───────────────────────────────────────────────
    const data = await fetchAndCache();
    const payload = asOf
      ? { ...data, packages: data.packages.filter((p) => p.date <= asOf) }
      : data;

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
        "X-Cache": "MISS",
        "X-Data-Source": "fresh",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[sanctions] Live fetch failed, falling back to static:", message);

    // Serve stale persistent cache on error
    const stale = await cacheGet<SanctionsPayload>(CACHE_KEY);
    if (stale) {
      const payload = asOf
        ? { ...stale.data, packages: stale.data.packages.filter((p) => p.date <= asOf) }
        : stale.data;
      return NextResponse.json(payload, {
        headers: {
          "Cache-Control": "public, s-maxage=3600",
          "X-Cache": "ERROR-STALE",
          "X-Data-Source": "stale-cache",
          "X-Error": message,
        },
      });
    }

    // Final fallback: static data only
    const packages = asOf ? getSanctionsByDate(asOf) : SANCTIONS_PACKAGES;
    return NextResponse.json(staticPayload(packages), {
      headers: {
        "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
        "X-Cache": "STATIC",
        "X-Data-Source": "static-fallback",
        "X-Error": message,
      },
    });
  }
}
