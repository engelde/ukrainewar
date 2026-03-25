import { NextResponse } from "next/server";
import { cacheGet, cacheSet, isFresh } from "@/lib/cache";
import prebuildData from "../../../../../public/data/acled-regional.json";

/**
 * GET /api/acled/regional
 *
 * Serves ACLED regional conflict statistics by oblast.
 * Data is pre-processed from HDX XLSX files via `scripts/process-acled-hdx.mjs`
 * and bundled at build time from `public/data/acled-regional.json`.
 */

const CACHE_KEY = "acled-regional";
const CACHE_TTL_SECONDS = 24 * 60 * 60;

export async function GET() {
  try {
    // Check KV cache first (may have fresher data from weekly rebuild)
    const cached = await cacheGet<Record<string, unknown>>(CACHE_KEY);
    if (cached && isFresh(cached)) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
          "X-Data-Source": "cache",
        },
      });
    }

    // Serve bundled prebuild data
    const data = prebuildData as Record<string, unknown>;
    await cacheSet(CACHE_KEY, data, CACHE_TTL_SECONDS).catch(() => {});

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
        "X-Data-Source": "prebuild",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[acled/regional] Error:", message);

    // Ultimate fallback — serve bundled data
    return NextResponse.json(prebuildData, {
      headers: {
        "Cache-Control": "public, s-maxage=3600",
        "X-Data-Source": "error-fallback",
      },
    });
  }
}
