import { type NextRequest, NextResponse } from "next/server";
import { cacheGet, cacheSet, isFresh } from "@/lib/cache";
import { CACHE_TTL } from "@/lib/constants";
import { checkRateLimit } from "@/lib/rate-limit";
import prebuildAcled from "../../../../public/data/acled-map.json";

/**
 * GET /api/acled
 *
 * Returns ACLED conflict events as GeoJSON for the map layer.
 *
 * Serves pre-built data from `public/data/acled-map.json` (bundled at build time)
 * for instant response. KV cache may contain fresher data from cron worker
 * background refresh. The prebuild contains events with fatalities >= 5 from
 * the full war period.
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

export async function GET(request: NextRequest) {
  const limited = checkRateLimit(request, "acled", 30, 60_000);
  if (limited) return limited;

  try {
    const { searchParams } = request.nextUrl;
    const defaults = getDefaultDateRange();
    const start = searchParams.get("start") || defaults.start;
    const end = searchParams.get("end") || defaults.end;

    const cacheKey = `acled-map:${start}:${end}`;

    // Check KV cache first (may have fresher data from background refresh)
    const cached = await cacheGet<GeoJSON.FeatureCollection>(cacheKey);
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

    // Serve bundled prebuild data (instant, no external API calls)
    const data = prebuildAcled as unknown as GeoJSON.FeatureCollection;

    // Populate KV cache for future requests
    await cacheSet(cacheKey, data, CACHE_TTL.ACLED).catch(() => {});

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": `public, s-maxage=${CACHE_TTL.ACLED}, stale-while-revalidate=3600`,
        "X-Cache": "PREBUILD",
        "X-Total-Count": String(data.features.length),
        "X-Date-Range": `${start} to ${end}`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to serve ACLED data";
    console.error("ACLED API error:", message);

    // Ultimate fallback — serve prebuild directly
    return NextResponse.json(prebuildAcled, {
      headers: {
        "Cache-Control": "public, s-maxage=3600",
        "X-Cache": "ERROR-FALLBACK",
      },
    });
  }
}
