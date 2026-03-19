import { NextResponse } from "next/server";
import { cacheGet, cacheSet, isFresh, isUsableStale } from "@/lib/cache";

const UNHCR_API = "https://api.unhcr.org/population/v1/population";
const CACHE_KEY = "humanitarian-refugees";
const TTL = 86400; // 24 hours

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v !== "-") return parseInt(v, 10) || 0;
  return 0;
}

interface UNHCRItem {
  year?: number;
  coa_name?: string;
  coa_iso?: string;
  refugees?: number | string;
  asylum_seekers?: number | string;
  returned_refugees?: number | string;
  idps?: number | string;
  returned_idps?: number | string;
  stateless?: number | string;
  ooc?: number | string;
}

type RefugeeData = Record<string, unknown>;

// In-memory fast layer
let memCache: RefugeeData | null = null;
let memCacheAt = 0;

async function fetchRefugeeData(): Promise<RefugeeData> {
  const [yearlyRes, countryRes] = await Promise.all([
    fetch(`${UNHCR_API}/?coo=UKR&yearFrom=2022&yearTo=2026&limit=10`, {
      next: { revalidate: TTL },
    }),
    fetch(`${UNHCR_API}/?coo=UKR&year=2024&coa_all=true&limit=100`, {
      next: { revalidate: TTL },
    }),
  ]);

  if (!yearlyRes.ok || !countryRes.ok) {
    throw new Error("Failed to fetch UNHCR data");
  }

  const [yearlyData, countryData] = await Promise.all([yearlyRes.json(), countryRes.json()]);

  const yearly = (yearlyData.items || [])
    .filter((item: UNHCRItem) => item.year)
    .map((item: UNHCRItem) => ({
      year: item.year,
      refugees: toNum(item.refugees),
      asylum_seekers: toNum(item.asylum_seekers),
      returned_refugees: toNum(item.returned_refugees),
      idps: toNum(item.idps),
      returned_idps: toNum(item.returned_idps),
      stateless: toNum(item.stateless),
      others_of_concern: toNum(item.ooc),
    }))
    .sort((a: { year: number }, b: { year: number }) => a.year - b.year);

  const countries = (countryData.items || [])
    .filter((item: UNHCRItem) => item.coa_name && item.coa_name !== "-" && toNum(item.refugees) > 0)
    .map((item: UNHCRItem) => ({
      country: item.coa_name,
      iso: item.coa_iso,
      refugees: toNum(item.refugees),
      asylum_seekers: toNum(item.asylum_seekers),
    }))
    .sort((a: { refugees: number }, b: { refugees: number }) => b.refugees - a.refugees);

  const latest = yearly[yearly.length - 1] || {};
  const totalRefugees = countries.reduce(
    (sum: number, c: { refugees: number }) => sum + c.refugees,
    0,
  );

  return {
    summary: {
      total_refugees: totalRefugees || latest.refugees || 0,
      total_idps: latest.idps || 0,
      total_countries: countries.length,
      latest_year: latest.year || 2024,
    },
    yearly,
    countries,
    source: "UNHCR Refugee Data Finder",
    updated: new Date().toISOString(),
  };
}

// Dedup concurrent fetches
let inflightPromise: Promise<RefugeeData> | null = null;

async function fetchAndCache(): Promise<RefugeeData> {
  if (inflightPromise) return inflightPromise;
  inflightPromise = (async () => {
    const data = await fetchRefugeeData();
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
    console.error("[refugees] Background refresh failed:", err);
  });
}

export async function GET() {
  try {
    // Fast in-memory layer
    if (memCache && Date.now() - memCacheAt < TTL * 1000) {
      return NextResponse.json(memCache, {
        headers: {
          "Cache-Control": `public, s-maxage=${TTL}, stale-while-revalidate=3600`,
          "X-Cache": "HIT",
        },
      });
    }

    // Persistent cache layer
    const cached = await cacheGet<RefugeeData>(CACHE_KEY);

    if (cached && isFresh(cached)) {
      memCache = cached.data;
      memCacheAt = cached.timestamp;
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": `public, s-maxage=${TTL}, stale-while-revalidate=3600`,
          "X-Cache": "HIT",
        },
      });
    }

    if (cached && isUsableStale(cached)) {
      refreshInBackground();
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": `public, s-maxage=3600, stale-while-revalidate=${TTL}`,
          "X-Cache": "STALE",
        },
      });
    }

    // Cold start
    const data = await fetchAndCache();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": `public, s-maxage=${TTL}, stale-while-revalidate=3600`,
        "X-Cache": "MISS",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch UNHCR data";
    console.error("UNHCR API error:", message);

    // Serve any stale data on error
    const stale = await cacheGet<RefugeeData>(CACHE_KEY);
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

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
