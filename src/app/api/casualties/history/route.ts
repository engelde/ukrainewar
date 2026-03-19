import { NextResponse } from "next/server";
import { cacheGet, cacheSet, isFresh, isUsableStale } from "@/lib/cache";

const ORC_LOSSES_URL =
  "https://raw.githubusercontent.com/lod-db/orc-losses/main/russian-losses.json";
const PERSISTENT_TTL = 86400; // 24 hours
const CACHE_KEY = "casualties-history";

interface OrcLossEntry {
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

async function getHistoricalData(): Promise<OrcLossEntry[]> {
  // Layer 1: In-memory cache
  if (cachedData && Date.now() - cacheTime < MEM_CACHE_DURATION) {
    return cachedData;
  }

  // Layer 2: Persistent cache
  const persistent = await cacheGet<OrcLossEntry[]>(CACHE_KEY);

  if (persistent && isFresh(persistent)) {
    cachedData = persistent.data;
    cacheTime = Date.now();
    return cachedData;
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
          console.error("[casualties/history] Background refresh failed:", err);
          return cachedData || [];
        })
        .finally(() => {
          inflightPromise = null;
        });
    }
    return cachedData;
  }

  // Layer 3: Cold fetch
  const data = await fetchFromUpstream();
  cachedData = data;
  cacheTime = Date.now();
  await cacheSet(CACHE_KEY, data, PERSISTENT_TTL);
  return data;
}

function findByDate(data: OrcLossEntry[], targetDate: string): OrcLossEntry | null {
  // targetDate is "YYYYMMDD", data dates are "YYYY-MM-DD"
  const formatted = `${targetDate.slice(0, 4)}-${targetDate.slice(4, 6)}-${targetDate.slice(6, 8)}`;

  // Binary search
  let lo = 0,
    hi = data.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (data[mid].date === formatted) return data[mid];
    if (data[mid].date < formatted) lo = mid + 1;
    else hi = mid - 1;
  }

  // Return closest earlier date if exact not found
  const idx = Math.max(0, hi);
  return data[idx] || null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date"); // YYYYMMDD

  if (!date || !/^\d{8}$/.test(date)) {
    return NextResponse.json(
      { error: "Missing or invalid 'date' parameter (YYYYMMDD)" },
      { status: 400 },
    );
  }

  // Determine X-Cache status based on where data comes from
  let xCache = "MISS";

  try {
    // Check if we'll serve from cache
    const memFresh = cachedData && Date.now() - cacheTime < MEM_CACHE_DURATION;
    if (memFresh) {
      xCache = "HIT";
    } else {
      const persistent = await cacheGet<OrcLossEntry[]>(CACHE_KEY);
      if (persistent && isFresh(persistent)) {
        xCache = "HIT";
      } else if (persistent && isUsableStale(persistent)) {
        xCache = "STALE";
      }
    }

    const data = await getHistoricalData();
    const entry = findByDate(data, date);

    if (!entry) {
      return NextResponse.json({ error: "No data for that date" }, { status: 404 });
    }

    // Find previous day for daily deltas
    const entryIdx = data.indexOf(entry);
    const prevEntry = entryIdx > 0 ? data[entryIdx - 1] : null;

    const v = (val: number | null) => val ?? 0;
    const delta = (curr: number | null, prev: number | null | undefined) =>
      prev != null && curr != null ? Math.max(0, curr - prev) : 0;

    // Calculate war day (days since Feb 24, 2022)
    const warStart = new Date("2022-02-24");
    const entryDate = new Date(entry.date);
    const warDay = Math.floor((entryDate.getTime() - warStart.getTime()) / 86400000) + 1;

    const response = {
      day: warDay,
      date: entry.date,
      militaryPersonnel: [delta(entry.personnel, prevEntry?.personnel), v(entry.personnel)] as [
        number,
        number,
      ],
      tank: [delta(entry.tanks, prevEntry?.tanks), v(entry.tanks)] as [number, number],
      armoredCombatVehicle: [delta(entry.afvs, prevEntry?.afvs), v(entry.afvs)] as [number, number],
      artillerySystem: [delta(entry.artillery, prevEntry?.artillery), v(entry.artillery)] as [
        number,
        number,
      ],
      airDefenceSystem: [delta(entry.airDefense, prevEntry?.airDefense), v(entry.airDefense)] as [
        number,
        number,
      ],
      mlrs: [delta(entry.rocketSystems, prevEntry?.rocketSystems), v(entry.rocketSystems)] as [
        number,
        number,
      ],
      supplyVehicle: [
        delta(entry.unarmoredVehicles, prevEntry?.unarmoredVehicles),
        v(entry.unarmoredVehicles),
      ] as [number, number],
      jet: [
        delta(entry.fixedWingAircraft, prevEntry?.fixedWingAircraft),
        v(entry.fixedWingAircraft),
      ] as [number, number],
      copter: [
        delta(entry.rotaryWingAircraft, prevEntry?.rotaryWingAircraft),
        v(entry.rotaryWingAircraft),
      ] as [number, number],
      uav: [delta(entry.uavs, prevEntry?.uavs), v(entry.uavs)] as [number, number],
      ship: [delta(entry.ships, prevEntry?.ships), v(entry.ships)] as [number, number],
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
        "X-Cache": xCache,
      },
    });
  } catch (error) {
    // Try serving any available stale data
    if (cachedData) {
      const entry = findByDate(cachedData, date);
      if (entry) {
        const entryIdx = cachedData.indexOf(entry);
        const prevEntry = entryIdx > 0 ? cachedData[entryIdx - 1] : null;
        const v = (val: number | null) => val ?? 0;
        const delta = (curr: number | null, prev: number | null | undefined) =>
          prev != null && curr != null ? Math.max(0, curr - prev) : 0;
        const warStart = new Date("2022-02-24");
        const entryDate = new Date(entry.date);
        const warDay = Math.floor((entryDate.getTime() - warStart.getTime()) / 86400000) + 1;

        return NextResponse.json(
          {
            day: warDay,
            date: entry.date,
            militaryPersonnel: [
              delta(entry.personnel, prevEntry?.personnel),
              v(entry.personnel),
            ] as [number, number],
            tank: [delta(entry.tanks, prevEntry?.tanks), v(entry.tanks)] as [number, number],
            armoredCombatVehicle: [delta(entry.afvs, prevEntry?.afvs), v(entry.afvs)] as [
              number,
              number,
            ],
            artillerySystem: [delta(entry.artillery, prevEntry?.artillery), v(entry.artillery)] as [
              number,
              number,
            ],
            airDefenceSystem: [
              delta(entry.airDefense, prevEntry?.airDefense),
              v(entry.airDefense),
            ] as [number, number],
            mlrs: [
              delta(entry.rocketSystems, prevEntry?.rocketSystems),
              v(entry.rocketSystems),
            ] as [number, number],
            supplyVehicle: [
              delta(entry.unarmoredVehicles, prevEntry?.unarmoredVehicles),
              v(entry.unarmoredVehicles),
            ] as [number, number],
            jet: [
              delta(entry.fixedWingAircraft, prevEntry?.fixedWingAircraft),
              v(entry.fixedWingAircraft),
            ] as [number, number],
            copter: [
              delta(entry.rotaryWingAircraft, prevEntry?.rotaryWingAircraft),
              v(entry.rotaryWingAircraft),
            ] as [number, number],
            uav: [delta(entry.uavs, prevEntry?.uavs), v(entry.uavs)] as [number, number],
            ship: [delta(entry.ships, prevEntry?.ships), v(entry.ships)] as [number, number],
          },
          {
            headers: {
              "Cache-Control": "public, s-maxage=3600",
              "X-Cache": "ERROR-STALE",
              "X-Error": error instanceof Error ? error.message : "Unknown error",
            },
          },
        );
      }
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
