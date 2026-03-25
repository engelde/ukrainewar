import { NextResponse } from "next/server";
import { getOrcLossesData, getStaleFallbackData, type OrcLossEntry } from "@/lib/orc-losses";

function findByDate(data: OrcLossEntry[], targetDate: string): OrcLossEntry | null {
  // targetDate is "YYYYMMDD", data dates are "YYYY-MM-DD"
  const formatted = `${targetDate.slice(0, 4)}-${targetDate.slice(4, 6)}-${targetDate.slice(6, 8)}`;

  // No data exists before the war started
  if (data.length === 0 || formatted < data[0].date) return null;

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
  return hi >= 0 ? data[hi] : null;
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

  try {
    const { data, cacheStatus: xCache } = await getOrcLossesData();
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
    const staleData = await getStaleFallbackData();
    if (staleData) {
      const entry = findByDate(staleData, date);
      if (entry) {
        const entryIdx = staleData.indexOf(entry);
        const prevEntry = entryIdx > 0 ? staleData[entryIdx - 1] : null;
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
