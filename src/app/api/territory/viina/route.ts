import { NextRequest, NextResponse } from "next/server";

interface Place {
  lat: number;
  lng: number;
  name: string;
}

interface Snapshot {
  d: string; // YYYYMMDD
  r: number[]; // RU geonameids
  c: number[]; // CONTESTED geonameids
}

let placesCache: Record<string, Place> | null = null;
let controlCache: Snapshot[] | null = null;

async function loadData(origin: string) {
  if (!placesCache) {
    const res = await fetch(`${origin}/data/viina/places.json`);
    if (!res.ok) throw new Error(`Failed to load places: ${res.status}`);
    placesCache = await res.json();
  }
  if (!controlCache) {
    const res = await fetch(`${origin}/data/viina/control.json`);
    if (!res.ok) throw new Error(`Failed to load control: ${res.status}`);
    controlCache = await res.json();
  }
  return { places: placesCache!, control: controlCache! };
}

function findClosestSnapshot(
  snapshots: Snapshot[],
  targetDate: string
): Snapshot | null {
  if (snapshots.length === 0) return null;

  if (targetDate <= snapshots[0].d) return snapshots[0];
  if (targetDate >= snapshots[snapshots.length - 1].d)
    return snapshots[snapshots.length - 1];

  let lo = 0;
  let hi = snapshots.length - 1;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (snapshots[mid].d === targetDate) return snapshots[mid];
    if (snapshots[mid].d < targetDate) lo = mid + 1;
    else hi = mid - 1;
  }

  return snapshots[hi];
}

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");

  if (!date || !/^\d{8}$/.test(date)) {
    return NextResponse.json(
      { error: "date parameter required (YYYYMMDD)" },
      { status: 400 }
    );
  }

  try {
    const { places, control } = await loadData(new URL(request.url).origin);
    const snapshot = findClosestSnapshot(control, date);

    if (!snapshot) {
      return NextResponse.json(
        { error: "No VIINA data available" },
        { status: 404 }
      );
    }

    const features: GeoJSON.Feature[] = [];

    for (const geonameid of snapshot.r) {
      const place = places[geonameid];
      if (!place) continue;
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [place.lng, place.lat],
        },
        properties: {
          geonameid,
          name: place.name,
          status: "RU",
        },
      });
    }

    for (const geonameid of snapshot.c) {
      const place = places[geonameid];
      if (!place) continue;
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [place.lng, place.lat],
        },
        properties: {
          geonameid,
          name: place.name,
          status: "CONTESTED",
        },
      });
    }

    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features,
    };

    return NextResponse.json(
      {
        date,
        snapshotDate: snapshot.d,
        geojson,
        counts: {
          ru: snapshot.r.length,
          contested: snapshot.c.length,
        },
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=604800, stale-while-revalidate=86400",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to load VIINA territory data" },
      { status: 500 }
    );
  }
}
