import { NextResponse } from "next/server";
import type { WarEvent } from "@/data/events";
import { KEY_EVENTS } from "@/data/events";
import { cacheGet, cacheSet, isFresh } from "@/lib/cache";
import { CACHE_TTL } from "@/lib/constants";
import prebuildEvents from "../../../../public/data/events.json";

const CACHE_KEY = "events";

/**
 * GET /api/events
 *
 * Returns merged war events (Wikidata + ACLED + curated seed + missile attacks).
 *
 * Serves pre-built data from `public/data/events.json` (bundled at build time)
 * for instant response. KV cache may contain fresher data from cron worker
 * background refresh.
 */
export async function GET() {
  try {
    // Check KV cache first (may have fresher data from background refresh)
    const cached = await cacheGet<WarEvent[]>(CACHE_KEY);
    if (cached && isFresh(cached)) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": `public, s-maxage=${CACHE_TTL.EVENTS}, stale-while-revalidate=3600`,
          "X-Cache": "HIT",
          "X-Events-Count": String(cached.data.length),
        },
      });
    }

    // Serve bundled prebuild data (instant, no external API calls)
    const data = prebuildEvents as unknown as WarEvent[];

    // Populate KV cache for future requests
    await cacheSet(CACHE_KEY, data, CACHE_TTL.EVENTS).catch(() => {});

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": `public, s-maxage=${CACHE_TTL.EVENTS}, stale-while-revalidate=3600`,
        "X-Cache": "PREBUILD",
        "X-Events-Count": String(data.length),
      },
    });
  } catch (error) {
    console.error("[events] API error:", error instanceof Error ? error.message : error);

    // Ultimate fallback — hardcoded key events
    return NextResponse.json(KEY_EVENTS, {
      headers: {
        "Cache-Control": "public, s-maxage=3600",
        "X-Cache": "FALLBACK",
        "X-Events-Count": String(KEY_EVENTS.length),
      },
    });
  }
}
