import { type NextRequest, NextResponse } from "next/server";
import { cacheGet, cacheSet, isFresh, isUsableStale } from "@/lib/cache";
import { WARSPOTTING_API } from "@/lib/constants";

const PERSISTENT_TTL = 43200; // 12 hours

const WS_HEADERS = {
  "User-Agent": "UkraineWarTracker/1.0 (ukrainewar.app)",
  Accept: "application/json",
};

// In-memory cache keyed by month (YYYY-MM) — fast layer above persistent cache
const monthCache = new Map<string, { losses: Record<string, unknown>[]; cachedAt: number }>();
const MEM_CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

// Dedup concurrent fetches per month
const inflightPromises = new Map<string, Promise<Record<string, unknown>[]>>();

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

async function fetchDay(date: string): Promise<Record<string, unknown>[]> {
  try {
    const res = await fetch(`${WARSPOTTING_API}/losses/russia/${date}/`, {
      headers: WS_HEADERS,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.losses || [];
  } catch {
    return [];
  }
}

/**
 * Fetches all WarSpotting losses for a given month.
 * Parallelizes requests (5 concurrent) to stay within reasonable rate limits.
 */
async function fetchMonth(yearMonth: string): Promise<Record<string, unknown>[]> {
  const [yearStr, monthStr] = yearMonth.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysInMonth = getDaysInMonth(year, month);

  const allLosses: Record<string, unknown>[] = [];
  const batchSize = 5;

  for (let start = 1; start <= daysInMonth; start += batchSize) {
    const batch: Promise<Record<string, unknown>[]>[] = [];
    for (let day = start; day < start + batchSize && day <= daysInMonth; day++) {
      const date = `${yearStr}-${monthStr}-${String(day).padStart(2, "0")}`;
      batch.push(fetchDay(date));
    }
    const results = await Promise.all(batch);
    for (const losses of results) {
      allLosses.push(...losses);
    }
  }

  return allLosses;
}

function refreshInBackground(cacheKey: string, month: string) {
  if (inflightPromises.has(cacheKey)) return;
  const p = fetchMonth(month)
    .then(async (losses) => {
      monthCache.set(month, { losses, cachedAt: Date.now() });
      await cacheSet(cacheKey, losses, PERSISTENT_TTL);
      return losses;
    })
    .catch((err) => {
      console.error(`[losses/month] Background refresh failed for ${month}:`, err);
      return [] as Record<string, unknown>[];
    })
    .finally(() => {
      inflightPromises.delete(cacheKey);
    });
  inflightPromises.set(cacheKey, p);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // YYYY-MM format

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { error: "month parameter required in YYYY-MM format" },
      { status: 400 },
    );
  }

  if (month < "2022-02" || month > new Date().toISOString().slice(0, 7)) {
    return NextResponse.json({ error: "Month out of range (2022-02 to present)" }, { status: 400 });
  }

  const cacheKey = `losses-month:${month}`;

  try {
    // Layer 1: In-memory cache (fastest)
    const now = Date.now();
    const memCached = monthCache.get(month);
    if (memCached && now - memCached.cachedAt < MEM_CACHE_TTL) {
      return NextResponse.json(
        { month, count: memCached.losses.length, losses: memCached.losses },
        {
          headers: {
            "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=3600",
            "X-Cache": "HIT",
          },
        },
      );
    }

    // Layer 2: Persistent cache
    const persistent = await cacheGet<Record<string, unknown>[]>(cacheKey);

    if (persistent && isFresh(persistent)) {
      monthCache.set(month, { losses: persistent.data, cachedAt: Date.now() });
      return NextResponse.json(
        { month, count: persistent.data.length, losses: persistent.data },
        {
          headers: {
            "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=3600",
            "X-Cache": "HIT",
          },
        },
      );
    }

    if (persistent && isUsableStale(persistent)) {
      monthCache.set(month, { losses: persistent.data, cachedAt: Date.now() });
      refreshInBackground(cacheKey, month);
      return NextResponse.json(
        { month, count: persistent.data.length, losses: persistent.data },
        {
          headers: {
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=43200",
            "X-Cache": "STALE",
          },
        },
      );
    }

    // Layer 3: Cold fetch
    const losses = await fetchMonth(month);

    monthCache.set(month, { losses, cachedAt: now });
    await cacheSet(cacheKey, losses, PERSISTENT_TTL);

    // Evict oldest in-memory entries (keep 12 months)
    if (monthCache.size > 12) {
      const entries = [...monthCache.entries()].sort((a, b) => a[1].cachedAt - b[1].cachedAt);
      for (let i = 0; i < entries.length - 12; i++) {
        monthCache.delete(entries[i][0]);
      }
    }

    return NextResponse.json(
      { month, count: losses.length, losses },
      {
        headers: {
          "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=3600",
          "X-Cache": "MISS",
        },
      },
    );
  } catch (error) {
    // Try in-memory stale first, then persistent stale
    const memStale = monthCache.get(month);
    if (memStale) {
      return NextResponse.json(
        { month, count: memStale.losses.length, losses: memStale.losses },
        {
          headers: {
            "Cache-Control": "public, s-maxage=3600",
            "X-Cache": "ERROR-STALE",
            "X-Error": error instanceof Error ? error.message : "Unknown error",
          },
        },
      );
    }

    const persistentStale = await cacheGet<Record<string, unknown>[]>(cacheKey);
    if (persistentStale) {
      return NextResponse.json(
        { month, count: persistentStale.data.length, losses: persistentStale.data },
        {
          headers: {
            "Cache-Control": "public, s-maxage=3600",
            "X-Cache": "ERROR-STALE",
            "X-Error": error instanceof Error ? error.message : "Unknown error",
          },
        },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to fetch monthly losses",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 },
    );
  }
}
