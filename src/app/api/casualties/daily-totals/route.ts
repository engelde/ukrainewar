import { NextResponse } from "next/server";
import { cacheGet, cacheSet, isFresh, isUsableStale } from "@/lib/cache";

const ORC_LOSSES_URL =
  "https://raw.githubusercontent.com/lod-db/orc-losses/main/russian-losses.json";
const PERSISTENT_TTL = 86400; // 24 hours
const CACHE_KEY = "casualties-daily-totals";

interface OrcLossEntry {
  date: string;
  personnel: number | null;
}

type DailyTotal = { date: string; total: number };

// In-memory cache — fast layer above persistent cache
let cachedResult: DailyTotal[] | null = null;
let cacheTime = 0;
const MEM_CACHE_DURATION = 4 * 60 * 60 * 1000;

let inflightPromise: Promise<DailyTotal[]> | null = null;

async function fetchDailyTotals(): Promise<DailyTotal[]> {
  const res = await fetch(ORC_LOSSES_URL, { next: { revalidate: 14400 } });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

  const raw: OrcLossEntry[] = await res.json();
  const sorted = [...raw].reverse();

  const dailyTotals: DailyTotal[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    const curr = entry.personnel ?? 0;
    const prev = i > 0 ? (sorted[i - 1].personnel ?? 0) : 0;
    const daily = Math.max(0, curr - prev);
    dailyTotals.push({
      date: entry.date.replace(/-/g, ""),
      total: daily,
    });
  }

  return dailyTotals;
}

function refreshInBackground() {
  if (inflightPromise) return;
  inflightPromise = fetchDailyTotals()
    .then(async (data) => {
      cachedResult = data;
      cacheTime = Date.now();
      await cacheSet(CACHE_KEY, data, PERSISTENT_TTL);
      return data;
    })
    .catch((err) => {
      console.error("[casualties/daily-totals] Background refresh failed:", err);
      return cachedResult || [];
    })
    .finally(() => {
      inflightPromise = null;
    });
}

export async function GET() {
  try {
    // Layer 1: In-memory cache (fastest)
    const now = Date.now();
    if (cachedResult && now - cacheTime < MEM_CACHE_DURATION) {
      return NextResponse.json(cachedResult, {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
          "X-Cache": "HIT",
        },
      });
    }

    // Layer 2: Persistent cache
    const persistent = await cacheGet<DailyTotal[]>(CACHE_KEY);

    if (persistent && isFresh(persistent)) {
      cachedResult = persistent.data;
      cacheTime = Date.now();
      return NextResponse.json(persistent.data, {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
          "X-Cache": "HIT",
        },
      });
    }

    if (persistent && isUsableStale(persistent)) {
      cachedResult = persistent.data;
      cacheTime = Date.now();
      refreshInBackground();
      return NextResponse.json(persistent.data, {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
          "X-Cache": "STALE",
        },
      });
    }

    // Layer 3: Cold fetch
    const dailyTotals = await fetchDailyTotals();
    cachedResult = dailyTotals;
    cacheTime = now;
    await cacheSet(CACHE_KEY, dailyTotals, PERSISTENT_TTL);

    return NextResponse.json(dailyTotals, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    // Try in-memory stale first
    if (cachedResult) {
      return NextResponse.json(cachedResult, {
        headers: {
          "Cache-Control": "public, s-maxage=3600",
          "X-Cache": "ERROR-STALE",
          "X-Error": error instanceof Error ? error.message : "Unknown error",
        },
      });
    }

    // Try persistent stale
    const persistentStale = await cacheGet<DailyTotal[]>(CACHE_KEY);
    if (persistentStale) {
      return NextResponse.json(persistentStale.data, {
        headers: {
          "Cache-Control": "public, s-maxage=3600",
          "X-Cache": "ERROR-STALE",
          "X-Error": error instanceof Error ? error.message : "Unknown error",
        },
      });
    }

    return NextResponse.json(
      {
        error: "Failed to fetch daily totals",
        details: error instanceof Error ? error.message : "Unknown",
      },
      { status: 502 },
    );
  }
}
