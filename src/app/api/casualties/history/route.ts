import { NextResponse } from "next/server";

const ORC_LOSSES_URL =
  "https://raw.githubusercontent.com/lod-db/orc-losses/main/russian-losses.json";

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

// Cache the full dataset in-memory for the life of the worker
let cachedData: OrcLossEntry[] | null = null;
let cacheTime = 0;
const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours

async function getHistoricalData(): Promise<OrcLossEntry[]> {
  if (cachedData && Date.now() - cacheTime < CACHE_DURATION) {
    return cachedData;
  }

  const res = await fetch(ORC_LOSSES_URL, {
    next: { revalidate: 14400 },
  });

  if (!res.ok) throw new Error("Failed to fetch historical loss data");

  const data: OrcLossEntry[] = await res.json();
  // Data comes newest-first; we want oldest-first for binary search
  cachedData = data.reverse();
  cacheTime = Date.now();
  return cachedData;
}

function findByDate(data: OrcLossEntry[], targetDate: string): OrcLossEntry | null {
  // targetDate is "YYYYMMDD", data dates are "YYYY-MM-DD"
  const formatted = `${targetDate.slice(0, 4)}-${targetDate.slice(4, 6)}-${targetDate.slice(6, 8)}`;

  // Binary search
  let lo = 0, hi = data.length - 1;
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
      { status: 400 }
    );
  }

  try {
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
      militaryPersonnel: [delta(entry.personnel, prevEntry?.personnel), v(entry.personnel)] as [number, number],
      tank: [delta(entry.tanks, prevEntry?.tanks), v(entry.tanks)] as [number, number],
      armoredCombatVehicle: [delta(entry.afvs, prevEntry?.afvs), v(entry.afvs)] as [number, number],
      artillerySystem: [delta(entry.artillery, prevEntry?.artillery), v(entry.artillery)] as [number, number],
      airDefenceSystem: [delta(entry.airDefense, prevEntry?.airDefense), v(entry.airDefense)] as [number, number],
      mlrs: [delta(entry.rocketSystems, prevEntry?.rocketSystems), v(entry.rocketSystems)] as [number, number],
      supplyVehicle: [delta(entry.unarmoredVehicles, prevEntry?.unarmoredVehicles), v(entry.unarmoredVehicles)] as [number, number],
      jet: [delta(entry.fixedWingAircraft, prevEntry?.fixedWingAircraft), v(entry.fixedWingAircraft)] as [number, number],
      copter: [delta(entry.rotaryWingAircraft, prevEntry?.rotaryWingAircraft), v(entry.rotaryWingAircraft)] as [number, number],
      uav: [delta(entry.uavs, prevEntry?.uavs), v(entry.uavs)] as [number, number],
      ship: [delta(entry.ships, prevEntry?.ships), v(entry.ships)] as [number, number],
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
