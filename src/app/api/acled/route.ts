import { type NextRequest, NextResponse } from "next/server";
import { fetchAcledPages } from "@/lib/acled";
import { CACHE_TTL } from "@/lib/constants";
import type { AcledEvent } from "@/lib/types";

// Data cache keyed by date range
const dataCache = new Map<string, { data: GeoJSON.FeatureCollection; timestamp: number }>();
const CACHE_DURATION_MS = CACHE_TTL.ACLED * 1000;

/**
 * Compute a default date range: from 6 months before the recency cutoff
 * to the cutoff itself. The free ACLED tier has a 12-month recency limit.
 */
function getDefaultDateRange(): { start: string; end: string } {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setFullYear(cutoff.getFullYear() - 1);

  const start = new Date(cutoff);
  start.setMonth(start.getMonth() - 6);

  return {
    start: start.toISOString().slice(0, 10),
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
        notes: e.notes,
      },
    })),
  };
}

/**
 * GET /api/acled?start=YYYY-MM-DD&end=YYYY-MM-DD
 *
 * Returns ACLED conflict events as GeoJSON for map rendering.
 * Without date params, defaults to last 6 months of available data
 * (constrained by the 12-month recency limit on the free tier).
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

    const cacheKey = `${start}:${end}`;
    const cached = dataCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": `public, s-maxage=${CACHE_TTL.ACLED}, stale-while-revalidate=3600`,
          "X-Cache": "HIT",
          "X-Total-Count": String(cached.data.features.length),
          "X-Date-Range": `${start} to ${end}`,
        },
      });
    }

    const events = await fetchAcledPages(start, end);
    const geojson = toGeoJSON(events);

    dataCache.set(cacheKey, { data: geojson, timestamp: Date.now() });

    // Evict old cache entries (keep max 5)
    if (dataCache.size > 5) {
      const oldest = [...dataCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
      if (oldest) dataCache.delete(oldest[0]);
    }

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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
