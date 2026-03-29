import { NextResponse } from "next/server";
import { cacheGet, cacheSet, isFresh, isUsableStale } from "@/lib/cache";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * GET /api/positions?date=YYYYMMDD
 *
 * Fetches military positions from DeepState's direct API.
 * - No date or today's date → fetches live data from DeepState
 * - Past date → returns archived snapshot from KV (or 404 if none)
 *
 * Each live fetch is also archived with today's date key so
 * historical data accumulates over time.
 */

const CACHE_KEY = "deepstate-positions";
const ARCHIVE_PREFIX = "deepstate-positions:";
const TTL = 6 * 60 * 60; // 6 hours
const ARCHIVE_TTL = 365 * 24 * 60 * 60; // 1 year for archived snapshots
const DEEPSTATE_API = "https://deepstatemap.live/api/history/last";

interface ParsedPositions {
  datetime: string;
  units: GeoJSON.FeatureCollection;
  attacks: GeoJSON.FeatureCollection;
}

let memCache: ParsedPositions | null = null;
let memCacheAt = 0;

function parseDeepStateResponse(data: {
  id: number;
  datetime: string;
  map: GeoJSON.FeatureCollection;
}): ParsedPositions {
  const units: GeoJSON.Feature[] = [];
  const attacks: GeoJSON.Feature[] = [];

  for (const feature of data.map.features) {
    if (feature.geometry.type !== "Point") continue;

    // Strip altitude from 3D coordinates [lng, lat, alt] → [lng, lat]
    const coords = feature.geometry.coordinates;
    if (Array.isArray(coords) && coords.length > 2) {
      feature.geometry.coordinates = [coords[0], coords[1]];
    }

    const name = (feature.properties?.name as string) || "";
    const desc = (feature.properties?.description as string) || "";

    if (name.includes("geoJSON.status.attack_direction")) {
      const arrowMatch = desc.match(/icon=arrow_(\d+)/);
      const rotation = arrowMatch ? Number.parseInt(arrowMatch[1], 10) * 22.5 : 0;
      attacks.push({
        ...feature,
        properties: {
          type: "attack_direction",
          rotation,
        },
      });
    } else if (name.includes("units.")) {
      const unitMatch = name.match(/geoJSON\.(units\.[^\s]+)/);
      const unitId = unitMatch ? unitMatch[1] : name;
      const displayName = name.split("///")[0].trim();

      units.push({
        ...feature,
        properties: {
          type: "unit",
          unitId,
          name: displayName,
          fullName: name,
        },
      });
    }
  }

  return {
    datetime: data.datetime,
    units: { type: "FeatureCollection", features: units },
    attacks: { type: "FeatureCollection", features: attacks },
  };
}

let inflightPromise: Promise<ParsedPositions> | null = null;

async function fetchAndCache(): Promise<ParsedPositions> {
  if (inflightPromise) return inflightPromise;
  inflightPromise = (async () => {
    const res = await fetch(DEEPSTATE_API, {
      headers: { Accept: "application/json" },
      next: { revalidate: TTL },
    });
    if (!res.ok) throw new Error(`DeepState API returned ${res.status}`);
    const raw = await res.json();
    const parsed = parseDeepStateResponse(raw);
    memCache = parsed;
    memCacheAt = Date.now();
    await cacheSet(CACHE_KEY, parsed, TTL);

    // Archive today's snapshot for future historical lookups
    const today = todayYYYYMMDD();
    await cacheSet(`${ARCHIVE_PREFIX}${today}`, parsed, ARCHIVE_TTL);

    return parsed;
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
    console.error("[positions] Background refresh failed:", err);
  });
}

function todayYYYYMMDD(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

export async function GET(request: Request) {
  const limited = checkRateLimit(request, "positions", 60, 60_000);
  if (limited) return limited;

  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");
  const today = todayYYYYMMDD();
  const isHistorical = dateParam && dateParam !== today;

  // Historical date → look up archived snapshot only
  if (isHistorical) {
    const archived = await cacheGet<ParsedPositions>(`${ARCHIVE_PREFIX}${dateParam}`);
    if (archived) {
      return NextResponse.json(archived.data, {
        headers: {
          "Cache-Control": "public, s-maxage=86400, immutable",
          "X-Cache": "ARCHIVE",
          "X-Positions-Date": dateParam,
        },
      });
    }
    // No archive for this date
    return NextResponse.json(
      { error: "no_archive", date: dateParam },
      {
        status: 404,
        headers: { "Cache-Control": "public, s-maxage=3600" },
      },
    );
  }

  // Current/today → live data flow (existing logic)
  try {
    if (memCache && Date.now() - memCacheAt < TTL * 1000) {
      return NextResponse.json(memCache, {
        headers: {
          "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=3600",
          "X-Cache": "HIT",
        },
      });
    }

    const cached = await cacheGet<ParsedPositions>(CACHE_KEY);
    if (cached && isFresh(cached)) {
      memCache = cached.data;
      memCacheAt = Date.now();
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=3600",
          "X-Cache": "HIT",
        },
      });
    }

    if (cached && isUsableStale(cached)) {
      refreshInBackground();
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=21600",
          "X-Cache": "STALE",
        },
      });
    }

    const data = await fetchAndCache();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=3600",
        "X-Cache": "MISS",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch positions";
    console.error("Positions API error:", message);

    const stale = await cacheGet<ParsedPositions>(CACHE_KEY);
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

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
