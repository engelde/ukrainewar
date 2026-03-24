import { cacheGet, cacheSet, isFresh, isUsableStale } from "@/lib/cache";

const ORC_LOSSES_URL =
  "https://raw.githubusercontent.com/lod-db/orc-losses/main/russian-losses.json";
const PERSISTENT_TTL = 86400; // 24 hours
const CACHE_KEY = "orc-losses-raw";

export interface OrcLossEntry {
  date: string;
  personnel: number | null;
  tanks: number | null;
  afvs: number | null;
  artillery: number | null;
  airDefense: number | null;
  rocketSystems: number | null;
  unarmoredVehicles: number | null;
  fixedWingAircraft: number | null;
  rotaryWingAircraft: number | null;
  uavs: number | null;
  ships: number | null;
  specialEquipment: number | null;
  missiles: number | null;
}

export type CacheStatus = "HIT" | "STALE" | "MISS";

// In-memory cache — fast layer above persistent cache
let cachedData: OrcLossEntry[] | null = null;
let cacheTime = 0;
const MEM_CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours

let inflightPromise: Promise<OrcLossEntry[]> | null = null;

async function fetchFromUpstream(): Promise<OrcLossEntry[]> {
  const res = await fetch(ORC_LOSSES_URL, {
    next: { revalidate: 14400 },
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const data: OrcLossEntry[] = await res.json();
  return data.reverse(); // oldest-first for binary search
}

/**
 * Returns the ORC losses dataset (oldest-first) with cache status.
 * Uses a 3-layer cache: in-memory → persistent → upstream fetch.
 */
export async function getOrcLossesData(): Promise<{
  data: OrcLossEntry[];
  cacheStatus: CacheStatus;
}> {
  // Layer 1: In-memory cache
  if (cachedData && Date.now() - cacheTime < MEM_CACHE_DURATION) {
    return { data: cachedData, cacheStatus: "HIT" };
  }

  // Layer 2: Persistent cache
  const persistent = await cacheGet<OrcLossEntry[]>(CACHE_KEY);

  if (persistent && isFresh(persistent)) {
    cachedData = persistent.data;
    cacheTime = Date.now();
    return { data: cachedData, cacheStatus: "HIT" };
  }

  if (persistent && isUsableStale(persistent)) {
    cachedData = persistent.data;
    cacheTime = Date.now();
    // Background refresh
    if (!inflightPromise) {
      inflightPromise = fetchFromUpstream()
        .then(async (data) => {
          cachedData = data;
          cacheTime = Date.now();
          await cacheSet(CACHE_KEY, data, PERSISTENT_TTL);
          return data;
        })
        .catch((err) => {
          console.error("[orc-losses] Background refresh failed:", err);
          return cachedData || [];
        })
        .finally(() => {
          inflightPromise = null;
        });
    }
    return { data: cachedData, cacheStatus: "STALE" };
  }

  // Layer 3: Cold fetch
  const data = await fetchFromUpstream();
  cachedData = data;
  cacheTime = Date.now();
  await cacheSet(CACHE_KEY, data, PERSISTENT_TTL);
  return { data, cacheStatus: "MISS" };
}

/**
 * Returns any available stale data for error-fallback scenarios.
 * Checks in-memory first, then persistent cache.
 */
export async function getStaleFallbackData(): Promise<OrcLossEntry[] | null> {
  if (cachedData) return cachedData;
  const persistent = await cacheGet<OrcLossEntry[]>(CACHE_KEY);
  return persistent?.data ?? null;
}
