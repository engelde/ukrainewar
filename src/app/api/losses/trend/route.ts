import { NextResponse } from "next/server";
import { cacheGet, cacheSet, isFresh, isUsableStale } from "@/lib/cache";
import { CACHE_TTL, WARSPOTTING_API } from "@/lib/constants";

const CACHE_KEY = "losses-trend";

const headers = {
  "User-Agent": "UkraineWarTracker/1.0 (ukrainewar.app)",
  Accept: "application/json",
};

interface Loss {
  date: string;
  type: string;
}

interface TrendData {
  dates: string[];
  totalTrend: { date: string; count: number }[];
  typeTrends: Record<string, { date: string; count: number }[]>;
}

let inflightPromise: Promise<TrendData> | null = null;

async function fetchTrend(): Promise<TrendData> {
  const res = await fetch(`${WARSPOTTING_API}/losses/russia/recent/`, {
    headers,
    next: { revalidate: 21600 },
  });

  if (!res.ok) throw new Error(`WarSpotting API returned ${res.status}`);

  const data = await res.json();
  const losses: Loss[] = data.losses || [];

  const byDate: Record<string, number> = {};
  const byDateAndType: Record<string, Record<string, number>> = {};

  for (const loss of losses) {
    if (!loss.date) continue;
    const date = loss.date.split("T")[0];
    byDate[date] = (byDate[date] || 0) + 1;

    if (!byDateAndType[date]) byDateAndType[date] = {};
    const type = normalizeType(loss.type);
    byDateAndType[date][type] = (byDateAndType[date][type] || 0) + 1;
  }

  const dates = Object.keys(byDate).sort();
  const totalTrend = dates.map((d) => ({ date: d, count: byDate[d] }));

  const typeTrends: Record<string, { date: string; count: number }[]> = {};
  const allTypes = new Set<string>();
  for (const dateData of Object.values(byDateAndType)) {
    for (const type of Object.keys(dateData)) allTypes.add(type);
  }

  for (const type of allTypes) {
    typeTrends[type] = dates.map((d) => ({
      date: d,
      count: byDateAndType[d]?.[type] || 0,
    }));
  }

  return { dates, totalTrend, typeTrends };
}

function refreshInBackground() {
  if (inflightPromise) return;
  inflightPromise = fetchTrend()
    .then(async (data) => {
      await cacheSet(CACHE_KEY, data, CACHE_TTL.LOSSES_RECENT);
      return data;
    })
    .catch((err) => {
      console.error("[losses/trend] Background refresh failed:", err);
      throw err;
    })
    .finally(() => {
      inflightPromise = null;
    });
}

export async function GET() {
  try {
    const cached = await cacheGet<TrendData>(CACHE_KEY);

    if (cached && isFresh(cached)) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=3600",
          "X-Cache": "HIT",
        },
      });
    }

    if (cached && isUsableStale(cached)) {
      refreshInBackground();
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=21600",
          "X-Cache": "STALE",
        },
      });
    }

    const trendData = await fetchTrend();
    await cacheSet(CACHE_KEY, trendData, CACHE_TTL.LOSSES_RECENT);

    return NextResponse.json(trendData, {
      headers: {
        "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=3600",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    const stale = await cacheGet<TrendData>(CACHE_KEY);
    if (stale) {
      return NextResponse.json(stale.data, {
        headers: {
          "Cache-Control": "public, s-maxage=3600",
          "X-Cache": "ERROR-STALE",
          "X-Error": error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function normalizeType(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("tank")) return "tanks";
  if (t.includes("ifv") || t.includes("apc") || t.includes("mrap") || t.includes("imv"))
    return "ifv";
  if (t.includes("artillery") || t.includes("howitzer") || t.includes("mortar")) return "artillery";
  if (t.includes("mlrs") || t.includes("rocket")) return "mlrs";
  if (t.includes("uav") || t.includes("drone") || t.includes("uas")) return "uav";
  if (t.includes("air defense") || t.includes("anti-air") || t.includes("sam")) return "airDefense";
  if (t.includes("jet") || t.includes("aircraft") || t.includes("fighter") || t.includes("bomber"))
    return "jets";
  if (t.includes("helicopter") || t.includes("heli")) return "helicopters";
  if (t.includes("ship") || t.includes("boat") || t.includes("vessel")) return "ships";
  if (
    t.includes("truck") ||
    t.includes("vehicle") ||
    t.includes("car") ||
    t.includes("engineering") ||
    t.includes("logistics")
  )
    return "vehicles";
  return "other";
}
