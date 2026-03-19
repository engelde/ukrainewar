import { NextResponse } from "next/server";
import { cacheGet, cacheSet, isFresh, isUsableStale } from "@/lib/cache";

const HDX_HAPI = "https://hapi.humdata.org/api/v2";
const APP_ID = Buffer.from("ukrainewar:contact@ukrainewar.app").toString("base64");
const CACHE_KEY = "humanitarian-funding";
const TTL = 86400; // 24 hours

interface FundingItem {
  appeal_code: string;
  appeal_name: string;
  appeal_type: string;
  requirements_usd: number | null;
  funding_usd: number | null;
  funding_pct: number | null;
  reference_period_start: string;
  reference_period_end: string;
}

type FundingData = Record<string, unknown>;

// In-memory fast layer
let memCache: FundingData | null = null;
let memCacheAt = 0;

async function fetchFundingData(): Promise<FundingData> {
  const res = await fetch(
    `${HDX_HAPI}/coordination-context/funding?location_code=UKR&app_identifier=${APP_ID}&output_format=json&limit=50`,
    { next: { revalidate: TTL } },
  );

  if (!res.ok) {
    throw new Error("Failed to fetch HDX funding data");
  }

  const data = await res.json();

  // Filter to named appeals (not "Not specified") and war-era (2022+) with actual data
  const appeals = (data.data || [])
    .filter(
      (item: FundingItem) =>
        item.appeal_name &&
        !item.appeal_name.startsWith("Not specified") &&
        item.reference_period_start >= "2022" &&
        ((item.requirements_usd && item.requirements_usd > 0) ||
          (item.funding_usd && item.funding_usd > 0)),
    )
    .map((item: FundingItem) => ({
      code: item.appeal_code,
      name: item.appeal_name,
      type: item.appeal_type,
      requirements_usd: item.requirements_usd || 0,
      funding_usd: item.funding_usd || 0,
      funding_pct: item.funding_pct || 0,
      year: parseInt(item.reference_period_start.slice(0, 4), 10),
    }))
    .sort((a: { year: number }, b: { year: number }) => a.year - b.year);

  // Calculate totals
  const totalRequired = appeals.reduce(
    (sum: number, a: { requirements_usd: number }) => sum + a.requirements_usd,
    0,
  );
  const totalFunded = appeals.reduce(
    (sum: number, a: { funding_usd: number }) => sum + a.funding_usd,
    0,
  );

  return {
    summary: {
      total_required_usd: totalRequired,
      total_funded_usd: totalFunded,
      overall_pct: totalRequired > 0 ? Math.round((totalFunded / totalRequired) * 100) : 0,
      appeal_count: appeals.length,
    },
    appeals,
    source: "HDX HAPI / OCHA Financial Tracking Service",
    updated: new Date().toISOString(),
  };
}

// Dedup concurrent fetches
let inflightPromise: Promise<FundingData> | null = null;

async function fetchAndCache(): Promise<FundingData> {
  if (inflightPromise) return inflightPromise;
  inflightPromise = (async () => {
    const data = await fetchFundingData();
    memCache = data;
    memCacheAt = Date.now();
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
    console.error("[funding] Background refresh failed:", err);
  });
}

export async function GET() {
  try {
    // Fast in-memory layer
    if (memCache && Date.now() - memCacheAt < TTL * 1000) {
      return NextResponse.json(memCache, {
        headers: {
          "Cache-Control": `public, s-maxage=${TTL}, stale-while-revalidate=3600`,
          "X-Cache": "HIT",
        },
      });
    }

    // Persistent cache layer
    const cached = await cacheGet<FundingData>(CACHE_KEY);

    if (cached && isFresh(cached)) {
      memCache = cached.data;
      memCacheAt = cached.timestamp;
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": `public, s-maxage=${TTL}, stale-while-revalidate=3600`,
          "X-Cache": "HIT",
        },
      });
    }

    if (cached && isUsableStale(cached)) {
      refreshInBackground();
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": `public, s-maxage=3600, stale-while-revalidate=${TTL}`,
          "X-Cache": "STALE",
        },
      });
    }

    // Cold start
    const data = await fetchAndCache();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": `public, s-maxage=${TTL}, stale-while-revalidate=3600`,
        "X-Cache": "MISS",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch HDX funding data";
    console.error("HDX Funding API error:", message);

    // Serve any stale data on error
    const stale = await cacheGet<FundingData>(CACHE_KEY);
    if (stale) {
      return NextResponse.json(stale.data, {
        headers: {
          "Cache-Control": "public, s-maxage=3600",
          "X-Cache": "ERROR-STALE",
          "X-Error": message,
        },
      });
    }

    if (memCache) {
      return NextResponse.json(memCache, {
        headers: {
          "Cache-Control": "public, s-maxage=3600",
          "X-Cache": "ERROR-STALE",
          "X-Error": message,
        },
      });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
