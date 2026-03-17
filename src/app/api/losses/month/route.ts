import { NextRequest, NextResponse } from "next/server";
import { WARSPOTTING_API } from "@/lib/constants";

const WS_HEADERS = {
  "User-Agent": "UkraineWarTracker/1.0 (ukrainewar.app)",
  Accept: "application/json",
};

// In-memory cache keyed by month (YYYY-MM)
const monthCache = new Map<
  string,
  { losses: Record<string, unknown>[]; cachedAt: number }
>();
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

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
async function fetchMonth(
  yearMonth: string
): Promise<Record<string, unknown>[]> {
  const [yearStr, monthStr] = yearMonth.split("-");
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);
  const daysInMonth = getDaysInMonth(year, month);

  const allLosses: Record<string, unknown>[] = [];
  const batchSize = 5;

  for (let start = 1; start <= daysInMonth; start += batchSize) {
    const batch: Promise<Record<string, unknown>[]>[] = [];
    for (
      let day = start;
      day < start + batchSize && day <= daysInMonth;
      day++
    ) {
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // YYYY-MM format

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { error: "month parameter required in YYYY-MM format" },
      { status: 400 }
    );
  }

  // Validate month is within war range
  if (month < "2022-02" || month > new Date().toISOString().slice(0, 7)) {
    return NextResponse.json(
      { error: "Month out of range (2022-02 to present)" },
      { status: 400 }
    );
  }

  try {
    const now = Date.now();
    const cached = monthCache.get(month);
    if (cached && now - cached.cachedAt < CACHE_TTL) {
      return NextResponse.json(
        { month, count: cached.losses.length, losses: cached.losses },
        {
          headers: {
            "Cache-Control":
              "public, s-maxage=43200, stale-while-revalidate=3600",
            "X-Data-Source": "cache",
          },
        }
      );
    }

    const losses = await fetchMonth(month);

    monthCache.set(month, { losses, cachedAt: now });

    // Evict oldest entries if cache grows too large (keep 12 months)
    if (monthCache.size > 12) {
      const entries = [...monthCache.entries()].sort(
        (a, b) => a[1].cachedAt - b[1].cachedAt
      );
      for (let i = 0; i < entries.length - 12; i++) {
        monthCache.delete(entries[i][0]);
      }
    }

    return NextResponse.json(
      { month, count: losses.length, losses },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=43200, stale-while-revalidate=3600",
          "X-Data-Source": "fresh",
        },
      }
    );
  } catch (error) {
    const cached = monthCache.get(month);
    if (cached) {
      return NextResponse.json(
        { month, count: cached.losses.length, losses: cached.losses },
        {
          headers: {
            "Cache-Control": "public, s-maxage=3600",
            "X-Data-Source": "stale-cache",
          },
        }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to fetch monthly losses",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 }
    );
  }
}
