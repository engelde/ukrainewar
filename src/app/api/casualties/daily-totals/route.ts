import { NextResponse } from "next/server";

const ORC_LOSSES_URL =
  "https://raw.githubusercontent.com/lod-db/orc-losses/main/russian-losses.json";

interface OrcLossEntry {
  date: string;
  personnel: number | null;
}

let cachedResult: { date: string; total: number }[] | null = null;
let cacheTime = 0;
const CACHE_DURATION = 4 * 60 * 60 * 1000;

export async function GET() {
  try {
    const now = Date.now();
    if (cachedResult && now - cacheTime < CACHE_DURATION) {
      return NextResponse.json(cachedResult, {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
          "X-Data-Source": "cache",
        },
      });
    }

    const res = await fetch(ORC_LOSSES_URL, { next: { revalidate: 14400 } });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

    const raw: OrcLossEntry[] = await res.json();
    // Data arrives newest-first; reverse to oldest-first
    const sorted = [...raw].reverse();

    const dailyTotals: { date: string; total: number }[] = [];
    for (let i = 0; i < sorted.length; i++) {
      const entry = sorted[i];
      const curr = entry.personnel ?? 0;
      const prev = i > 0 ? (sorted[i - 1].personnel ?? 0) : 0;
      const daily = Math.max(0, curr - prev);
      // Convert YYYY-MM-DD to YYYYMMDD
      dailyTotals.push({
        date: entry.date.replace(/-/g, ""),
        total: daily,
      });
    }

    cachedResult = dailyTotals;
    cacheTime = now;

    return NextResponse.json(dailyTotals, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
        "X-Data-Source": "fresh",
      },
    });
  } catch (error) {
    if (cachedResult) {
      return NextResponse.json(cachedResult, {
        headers: { "X-Data-Source": "stale-cache" },
      });
    }
    return NextResponse.json(
      { error: "Failed to fetch daily totals", details: error instanceof Error ? error.message : "Unknown" },
      { status: 502 }
    );
  }
}
