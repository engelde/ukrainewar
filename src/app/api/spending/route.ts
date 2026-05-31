import { NextResponse } from "next/server";
import { cacheGet, cacheSet, isFresh } from "@/lib/cache";
import {
  isValidSpendingData,
  type SpendingData,
  spendingDataFingerprint,
} from "@/lib/spending-data";
import prebuildData from "../../../../public/data/kiel-spending.json";

/**
 * GET /api/spending
 *
 * Serves pre-processed Kiel Institute spending data.
 * The XLSX processing happens offline via `scripts/prebuild-spending.ts`
 * (run weekly by the update-spending GitHub Action), producing
 * `public/data/kiel-spending.json` which is bundled at build time.
 *
 * The cache key is versioned by a content fingerprint so deploying corrected
 * data for the same Kiel release bypasses stale KV entries.
 */

const CACHE_KEY = `spending-kiel-${spendingDataFingerprint(prebuildData)}`;
const TTL = 604800; // 7 days

export async function GET() {
  try {
    // Try KV cache first (may have fresher data from weekly rebuild)
    const cached = await cacheGet<unknown>(CACHE_KEY);
    if (cached && isFresh(cached) && isValidSpendingData(cached.data)) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
          "X-Cache": "HIT",
          "X-Data-Source": "cache",
        },
      });
    }

    // Serve bundled prebuild data
    if (!isValidSpendingData(prebuildData)) {
      throw new Error("Bundled Kiel spending data failed validation");
    }
    const data = prebuildData as SpendingData;
    await cacheSet(CACHE_KEY, data, TTL).catch(() => {});

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
        "X-Cache": "MISS",
        "X-Data-Source": "prebuild",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch spending data";
    console.error("Kiel spending error:", message);

    // Serve bundled data as ultimate fallback
    if (isValidSpendingData(prebuildData)) {
      return NextResponse.json(prebuildData, {
        headers: {
          "Cache-Control": "public, s-maxage=3600",
          "X-Cache": "ERROR-FALLBACK",
          "X-Error": message,
        },
      });
    }

    return NextResponse.json(
      { error: message },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-Cache": "ERROR-FALLBACK",
          "X-Error": message,
        },
        status: 500,
      },
    );
  }
}
