import { type NextRequest, NextResponse } from "next/server";
import { cacheGet, cacheSet, isFresh, isUsableStale } from "@/lib/cache";
import { WARSPOTTING_API } from "@/lib/constants";

const PERSISTENT_TTL = 86400; // 24 hours

const headers = {
  "User-Agent": "UkraineWarTracker/1.0 (ukrainewar.app)",
  Accept: "application/json",
};

// In-memory cache keyed by date — fast layer above persistent cache
const dateCache = new Map<string, { data: unknown; cachedAt: number }>();
const MEM_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Dedup concurrent fetches per date
const inflightPromises = new Map<string, Promise<unknown>>();

async function fetchDate(date: string): Promise<unknown> {
  const res = await fetch(`${WARSPOTTING_API}/losses/russia/${date}/`, { headers });
  if (!res.ok) throw new Error(`WarSpotting API returned ${res.status}`);
  return res.json();
}

function refreshInBackground(cacheKey: string, date: string) {
  if (inflightPromises.has(cacheKey)) return;
  const p = fetchDate(date)
    .then(async (data) => {
      dateCache.set(date, { data, cachedAt: Date.now() });
      await cacheSet(cacheKey, data, PERSISTENT_TTL);
      return data;
    })
    .catch((err) => {
      console.error(`[losses/historical] Background refresh failed for ${date}:`, err);
    })
    .finally(() => {
      inflightPromises.delete(cacheKey);
    });
  inflightPromises.set(cacheKey, p);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date"); // YYYY-MM-DD format

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "date parameter required in YYYY-MM-DD format" },
      { status: 400 },
    );
  }

  const cacheKey = `losses-historical:${date}`;

  try {
    // Layer 1: In-memory cache (fastest)
    const now = Date.now();
    const memCached = dateCache.get(date);
    if (memCached && now - memCached.cachedAt < MEM_CACHE_TTL) {
      return NextResponse.json(memCached.data, {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
          "X-Cache": "HIT",
        },
      });
    }

    // Layer 2: Persistent cache
    const persistent = await cacheGet<unknown>(cacheKey);

    if (persistent && isFresh(persistent)) {
      dateCache.set(date, { data: persistent.data, cachedAt: Date.now() });
      return NextResponse.json(persistent.data, {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
          "X-Cache": "HIT",
        },
      });
    }

    if (persistent && isUsableStale(persistent)) {
      dateCache.set(date, { data: persistent.data, cachedAt: Date.now() });
      refreshInBackground(cacheKey, date);
      return NextResponse.json(persistent.data, {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
          "X-Cache": "STALE",
        },
      });
    }

    // Layer 3: Cold fetch
    const data = await fetchDate(date);

    dateCache.set(date, { data, cachedAt: now });
    await cacheSet(cacheKey, data, PERSISTENT_TTL);

    // Prevent unbounded in-memory cache growth — keep last 60 dates
    if (dateCache.size > 60) {
      const oldest = [...dateCache.entries()]
        .sort((a, b) => a[1].cachedAt - b[1].cachedAt)
        .slice(0, dateCache.size - 60);
      for (const [key] of oldest) dateCache.delete(key);
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    // Try in-memory stale first, then persistent stale
    const memStale = dateCache.get(date);
    if (memStale) {
      return NextResponse.json(memStale.data, {
        headers: {
          "Cache-Control": "public, s-maxage=3600",
          "X-Cache": "ERROR-STALE",
          "X-Error": error instanceof Error ? error.message : "Unknown error",
        },
      });
    }

    const persistentStale = await cacheGet<unknown>(cacheKey);
    if (persistentStale) {
      return NextResponse.json(persistentStale.data, {
        headers: {
          "Cache-Control": "public, s-maxage=3600",
          "X-Cache": "ERROR-STALE",
          "X-Error": error instanceof Error ? error.message : "Unknown error",
        },
      });
    }

    return NextResponse.json({ error: "Failed to fetch historical losses" }, { status: 500 });
  }
}
