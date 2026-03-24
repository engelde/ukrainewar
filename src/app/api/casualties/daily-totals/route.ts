import { NextResponse } from "next/server";
import { getOrcLossesData, getStaleFallbackData, type OrcLossEntry } from "@/lib/orc-losses";

type DailyTotal = { date: string; total: number };

function computeDailyTotals(sorted: OrcLossEntry[]): DailyTotal[] {
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

export async function GET() {
  try {
    const { data, cacheStatus } = await getOrcLossesData();
    const dailyTotals = computeDailyTotals(data);

    return NextResponse.json(dailyTotals, {
      headers: {
        "Cache-Control":
          cacheStatus === "STALE"
            ? "public, s-maxage=3600, stale-while-revalidate=86400"
            : "public, s-maxage=86400, stale-while-revalidate=43200",
        "X-Cache": cacheStatus,
      },
    });
  } catch (error) {
    // Try stale data from shared cache
    const staleData = await getStaleFallbackData();
    if (staleData) {
      return NextResponse.json(computeDailyTotals(staleData), {
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
