import { NextResponse } from "next/server";
import { cacheGet, cacheSet, isFresh, isUsableStale } from "@/lib/cache";
import { CACHE_TTL, DEEPSTATE_DATA_BASE } from "@/lib/constants";

const CACHE_KEY = "territory-latest";
const TTL = CACHE_TTL.TERRITORY; // 12 hours

interface TerritoryData {
  date: string;
  geojson: unknown;
}

// In-memory fast layer
let memCache: TerritoryData | null = null;
let memCacheAt = 0;

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

async function fetchTerritoryData(): Promise<TerritoryData> {
  const now = new Date();

  for (let i = 0; i < 5; i++) {
    const tryDate = new Date(now);
    tryDate.setDate(tryDate.getDate() - i);
    const dateStr = formatDate(tryDate);
    const url = `${DEEPSTATE_DATA_BASE}/deepstatemap_data_${dateStr}.geojson`;

    const res = await fetch(url, {
      next: { revalidate: 43200 },
    });

    if (res.ok) {
      const geojson = await res.json();
      return { date: dateStr, geojson };
    }
  }

  throw new Error("No territory data available");
}

// Dedup concurrent fetches
let inflightPromise: Promise<TerritoryData> | null = null;

async function fetchAndCache(): Promise<TerritoryData> {
  if (inflightPromise) return inflightPromise;
  inflightPromise = (async () => {
    const data = await fetchTerritoryData();
    memCache = data;
    memCacheAt = Date.now();
    await cacheSet(CACHE_KEY, data, TTL);
    return data;
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
    console.error("[territory] Background refresh failed:", err);
  });
}

export async function GET() {
  try {
    // Fast in-memory layer
    if (memCache && Date.now() - memCacheAt < TTL * 1000) {
      return NextResponse.json(memCache, {
        headers: {
          "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=7200",
          "X-Cache": "HIT",
        },
      });
    }

    // Persistent cache layer
    const cached = await cacheGet<TerritoryData>(CACHE_KEY);

    if (cached && isFresh(cached)) {
      memCache = cached.data;
      memCacheAt = cached.timestamp;
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=7200",
          "X-Cache": "HIT",
        },
      });
    }

    if (cached && isUsableStale(cached)) {
      refreshInBackground();
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=43200",
          "X-Cache": "STALE",
        },
      });
    }

    // Cold start
    const data = await fetchAndCache();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=7200",
        "X-Cache": "MISS",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch territory data";
    console.error("Territory API error:", message);

    // Serve any stale data on error
    const stale = await cacheGet<TerritoryData>(CACHE_KEY);
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

    return NextResponse.json({ error: "Failed to fetch territory data" }, { status: 500 });
  }
}
