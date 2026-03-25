import { NextResponse } from "next/server";
import { cacheGet, cacheSet, isFresh, isUsableStale } from "@/lib/cache";

/**
 * GET /api/spending
 *
 * Serves pre-processed Kiel Institute spending data from static assets.
 * The XLSX processing happens offline via `scripts/prebuild-spending.ts`
 * (run weekly by the update-spending GitHub Action), producing
 * `public/data/kiel-spending.json`.
 *
 * This route simply serves that JSON with multi-layer caching.
 */

const CACHE_KEY = "spending-kiel";
const TTL = 604800; // 7 days in seconds
const MEM_TTL = TTL * 1000;

let cachedData: Record<string, unknown> | null = null;
let cachedAt = 0;

async function loadPrebuildData(origin: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${origin}/data/kiel-spending.json`);
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  try {
    // Fast in-memory layer
    const now = Date.now();
    if (cachedData && now - cachedAt < MEM_TTL) {
      return NextResponse.json(cachedData, {
        headers: {
          "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
          "X-Cache": "HIT",
          "X-Data-Source": "cache",
        },
      });
    }

    // Persistent cache layer
    const cached = await cacheGet<Record<string, unknown>>(CACHE_KEY);

    if (cached && isFresh(cached)) {
      cachedData = cached.data;
      cachedAt = cached.timestamp;
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
          "X-Cache": "HIT",
          "X-Data-Source": "cache",
        },
      });
    }

    if (cached && isUsableStale(cached)) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=604800",
          "X-Cache": "STALE",
          "X-Data-Source": "stale-cache",
        },
      });
    }

    // Load pre-processed JSON from static assets
    const prebuild = await loadPrebuildData(origin);
    if (prebuild) {
      cachedData = prebuild;
      cachedAt = Date.now();
      await cacheSet(CACHE_KEY, prebuild, TTL);
      return NextResponse.json(prebuild, {
        headers: {
          "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
          "X-Cache": "MISS",
          "X-Data-Source": "prebuild",
        },
      });
    }

    return NextResponse.json({ error: "Spending data not available" }, { status: 503 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch spending data";
    console.error("Kiel spending error:", message);

    const stale = await cacheGet<Record<string, unknown>>(CACHE_KEY);
    if (stale) {
      return NextResponse.json(stale.data, {
        headers: {
          "Cache-Control": "public, s-maxage=3600",
          "X-Cache": "ERROR-STALE",
          "X-Data-Source": "stale-cache",
          "X-Error": message,
        },
      });
    }

    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          "Cache-Control": "public, s-maxage=3600",
          "X-Cache": "ERROR-STALE",
          "X-Data-Source": "stale-cache",
          "X-Error": message,
        },
      });
    }

    return NextResponse.json(
      { error: "Failed to fetch spending data", details: message },
      { status: 502 },
    );
  }
}
