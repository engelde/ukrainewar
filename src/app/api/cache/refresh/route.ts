import { type NextRequest, NextResponse } from "next/server";
import { fetchAcledPages } from "@/lib/acled";
import { cacheSet } from "@/lib/cache";
import { CACHE_TTL } from "@/lib/constants";
import type { AcledEvent } from "@/lib/types";

/**
 * POST /api/cache/refresh
 *
 * Pre-warms the persistent cache for slow data sources (ACLED map data).
 * Called by the Cloudflare cron worker daily. Can also be triggered manually.
 *
 * Protected by a simple shared secret in the Authorization header.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CACHE_REFRESH_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const results: { key: string; status: string; count?: number; ms: number }[] = [];

  // Refresh ACLED map data (the slowest endpoint — ~45s cold)
  const acledStart = Date.now();
  try {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setFullYear(cutoff.getFullYear() - 1);
    const start = "2022-02-24";
    const end = cutoff.toISOString().slice(0, 10);

    const events = await fetchAcledPages(start, end, {
      lightweight: true,
      extraParams: {
        fatalities: "5",
        fatalities_where: ">=",
      },
    });

    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: events.map((e: AcledEvent) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [e.longitude, e.latitude] },
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

    const cacheKey = `acled-map:${start}:${end}`;
    await cacheSet(cacheKey, geojson, CACHE_TTL.ACLED);

    results.push({
      key: "acled-map",
      status: "ok",
      count: geojson.features.length,
      ms: Date.now() - acledStart,
    });
  } catch (err) {
    results.push({
      key: "acled-map",
      status: `error: ${err instanceof Error ? err.message : "unknown"}`,
      ms: Date.now() - acledStart,
    });
  }

  return NextResponse.json({
    refreshed: results.filter((r) => r.status === "ok").length,
    total: results.length,
    results,
  });
}
