import { type NextRequest, NextResponse } from "next/server";
import { fetchAcledPages } from "@/lib/acled";
import { cacheGet, cacheSet, isFresh, isUsableStale } from "@/lib/cache";
import { CACHE_TTL } from "@/lib/constants";
import type { AcledEvent } from "@/lib/types";

// Dedup concurrent fetches
let inflightPromise: Promise<GeoJSON.FeatureCollection> | null = null;
let inflightKey: string | null = null;

/**
 * Compute the default date range based on the ACLED free-tier 12-month recency limit.
 * Returns the full available window: war start (2022-02-24) → recency cutoff.
 */
function getDefaultDateRange(): { start: string; end: string } {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setFullYear(cutoff.getFullYear() - 1);

  return {
    start: "2022-02-24",
    end: cutoff.toISOString().slice(0, 10),
  };
}

function isValidDate(d: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d));
}

function toGeoJSON(events: AcledEvent[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: events.map((e) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [e.longitude, e.latitude],
      },
      properties: {
        id: e.event_id,
        date: e.event_date,
        type: e.event_type,
        subtype: e.sub_event_type,
        actor1: e.actor1,
        actor2: e.actor2,
        location: e.location,
        fatalities: e.fatalities,
        admin1: e.admin1,
      },
    })),
  };
}

/**
 * Fetch ACLED events with fatality filter and lightweight fields for the map.
 * Drops `notes` (~50% smaller). Only events with >= 5 fatalities — reduces
 * from ~32K to ~7K events (2 pages instead of 7).
 */
async function fetchFilteredAcled(start: string, end: string): Promise<GeoJSON.FeatureCollection> {
  const events = await fetchAcledPages(start, end, {
    lightweight: true,
    extraParams: {
      fatalities: "5",
      fatalities_where: ">=",
    },
  });
  return toGeoJSON(events);
}

/**
 * GET /api/acled?start=YYYY-MM-DD&end=YYYY-MM-DD
 *
 * Caching strategy (3 layers):
 * 1. Persistent cache (file in dev, KV in prod) — survives restarts, 24h TTL
 * 2. Stale-while-refresh — serves stale data (up to 72h) while fetching fresh
 * 3. HTTP Cache-Control — CDN/browser caching with stale-while-revalidate
 * 4. Inflight dedup — concurrent requests share a single upstream fetch
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const defaults = getDefaultDateRange();
    const start = searchParams.get("start") || defaults.start;
    const end = searchParams.get("end") || defaults.end;

    if (!isValidDate(start) || !isValidDate(end)) {
      return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD." }, { status: 400 });
    }

    const cacheKey = `acled-map:${start}:${end}`;
    const cached = await cacheGet<GeoJSON.FeatureCollection>(cacheKey);

    // Serve from persistent cache if fresh
    if (cached && isFresh(cached)) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": `public, s-maxage=${CACHE_TTL.ACLED}, stale-while-revalidate=3600`,
          "X-Cache": "HIT",
          "X-Total-Count": String(cached.data.features.length),
          "X-Date-Range": `${start} to ${end}`,
        },
      });
    }

    // Serve stale data immediately — refresh will happen via cron or next uncached request
    if (cached && isUsableStale(cached)) {
      // Fire-and-forget background refresh (non-blocking)
      refreshInBackground(cacheKey, start, end);

      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": `public, s-maxage=3600, stale-while-revalidate=${CACHE_TTL.ACLED}`,
          "X-Cache": "STALE",
          "X-Total-Count": String(cached.data.features.length),
          "X-Date-Range": `${start} to ${end}`,
        },
      });
    }

    // Cold start — must fetch from ACLED API
    const geojson = await fetchWithDedup(cacheKey, start, end);

    return NextResponse.json(geojson, {
      headers: {
        "Cache-Control": `public, s-maxage=${CACHE_TTL.ACLED}, stale-while-revalidate=3600`,
        "X-Cache": "MISS",
        "X-Total-Count": String(geojson.features.length),
        "X-Date-Range": `${start} to ${end}`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch ACLED data";
    console.error("ACLED API error:", message);

    // Last resort: serve any stale cache on error
    const { searchParams } = request.nextUrl;
    const defaults = getDefaultDateRange();
    const start = searchParams.get("start") || defaults.start;
    const end = searchParams.get("end") || defaults.end;
    const stale = await cacheGet<GeoJSON.FeatureCollection>(`acled-map:${start}:${end}`);

    if (stale) {
      return NextResponse.json(stale.data, {
        headers: {
          "Cache-Control": "public, s-maxage=3600",
          "X-Cache": "ERROR-STALE",
          "X-Total-Count": String(stale.data.features.length),
          "X-Error": message,
        },
      });
    }

    return NextResponse.json({ error: message }, { status: 502 });
  }
}

async function fetchWithDedup(
  cacheKey: string,
  start: string,
  end: string,
): Promise<GeoJSON.FeatureCollection> {
  if (inflightPromise && inflightKey === cacheKey) {
    return inflightPromise;
  }

  inflightKey = cacheKey;
  inflightPromise = (async () => {
    const geojson = await fetchFilteredAcled(start, end);
    await cacheSet(cacheKey, geojson, CACHE_TTL.ACLED);
    return geojson;
  })();

  try {
    return await inflightPromise;
  } finally {
    inflightPromise = null;
    inflightKey = null;
  }
}

function refreshInBackground(cacheKey: string, start: string, end: string) {
  if (inflightPromise && inflightKey === cacheKey) return;
  fetchWithDedup(cacheKey, start, end).catch((err) => {
    console.error("[acled] Background refresh failed:", err);
  });
}
