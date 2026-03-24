import { type NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

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

// Tessellation: geonameid → outer ring coordinate array [[lng,lat], ...]
type Tessellation = Record<string, number[][]>;

let placesCache: Record<string, Place> | null = null;
let controlCache: Snapshot[] | null = null;
let tessCache: Tessellation | null = null;

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
  if (!tessCache) {
    const res = await fetch(`${origin}/data/viina/tessellation.json`);
    if (!res.ok) throw new Error(`Failed to load tessellation: ${res.status}`);
    tessCache = await res.json();
  }
  return { places: placesCache!, control: controlCache!, tess: tessCache! };
}

function findClosestSnapshot(snapshots: Snapshot[], targetDate: string): Snapshot | null {
  if (snapshots.length === 0) return null;

  if (targetDate <= snapshots[0].d) return snapshots[0];
  if (targetDate >= snapshots[snapshots.length - 1].d) return snapshots[snapshots.length - 1];

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

// Normalize an edge key so (A,B) and (B,A) produce the same string
function edgeKey(a: number[], b: number[]): string {
  const ax = a[0];
  const ay = a[1];
  const bx = b[0];
  const by = b[1];
  if (ax < bx || (ax === bx && ay < by)) return `${ax},${ay}|${bx},${by}`;
  return `${bx},${by}|${ax},${ay}`;
}

// Compute frontline as boundary edges of occupied territory
function computeFrontline(occupiedIds: number[], tess: Tessellation): GeoJSON.Feature | null {
  const edgeCounts = new Map<string, { a: number[]; b: number[]; count: number }>();

  for (const geonameid of occupiedIds) {
    const ring = tess[geonameid];
    if (!ring || ring.length < 3) continue;

    for (let i = 0; i < ring.length - 1; i++) {
      const key = edgeKey(ring[i], ring[i + 1]);
      const existing = edgeCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        edgeCounts.set(key, { a: ring[i], b: ring[i + 1], count: 1 });
      }
    }
  }

  // Boundary edges: shared by exactly 1 occupied polygon
  const boundaryEdges: number[][][] = [];
  for (const edge of edgeCounts.values()) {
    if (edge.count === 1) {
      boundaryEdges.push([edge.a, edge.b]);
    }
  }

  if (boundaryEdges.length === 0) return null;

  // Chain boundary edges into polylines for smoother rendering
  const adjacency = new Map<string, { coord: number[]; neighbors: string[] }>();
  for (const [a, b] of boundaryEdges) {
    const ka = `${a[0]},${a[1]}`;
    const kb = `${b[0]},${b[1]}`;
    if (!adjacency.has(ka)) adjacency.set(ka, { coord: a, neighbors: [] });
    if (!adjacency.has(kb)) adjacency.set(kb, { coord: b, neighbors: [] });
    adjacency.get(ka)!.neighbors.push(kb);
    adjacency.get(kb)!.neighbors.push(ka);
  }

  const visited = new Set<string>();
  const lines: number[][][] = [];

  // Find endpoints (nodes with degree != 2) for open chains
  const endpoints = [...adjacency.entries()].filter(([, n]) => n.neighbors.length !== 2);

  // Walk open chains from endpoints first
  for (const [startKey] of endpoints) {
    if (visited.has(startKey)) continue;
    const chain: number[][] = [];
    let current = startKey;

    while (current && !visited.has(current)) {
      visited.add(current);
      const node = adjacency.get(current)!;
      chain.push(node.coord);
      const next = node.neighbors.find((n) => !visited.has(n));
      current = next ?? "";
    }

    if (chain.length >= 2) lines.push(chain);
  }

  // Walk remaining closed loops (all degree-2 nodes that weren't reached)
  for (const [startKey] of adjacency) {
    if (visited.has(startKey)) continue;
    const chain: number[][] = [];
    let current = startKey;

    while (current && !visited.has(current)) {
      visited.add(current);
      const node = adjacency.get(current)!;
      chain.push(node.coord);
      const next = node.neighbors.find((n) => !visited.has(n));
      current = next ?? "";
    }

    if (chain.length >= 2) {
      // Close the loop by connecting back to the start
      chain.push([...chain[0]]);
      lines.push(chain);
    }
  }

  if (lines.length === 0) return null;

  return {
    type: "Feature",
    geometry: { type: "MultiLineString", coordinates: lines },
    properties: { type: "frontline" },
  };
}

export async function GET(request: NextRequest) {
  const limited = checkRateLimit(request, "territory-viina", 120, 60_000);
  if (limited) return limited;

  const date = request.nextUrl.searchParams.get("date");

  if (!date || !/^\d{8}$/.test(date)) {
    return NextResponse.json({ error: "date parameter required (YYYYMMDD)" }, { status: 400 });
  }

  try {
    const { places, control, tess } = await loadData(new URL(request.url).origin);
    const snapshot = findClosestSnapshot(control, date);

    if (!snapshot) {
      return NextResponse.json({ error: "No VIINA data available" }, { status: 404 });
    }

    const features: GeoJSON.Feature[] = [];

    for (const geonameid of snapshot.r) {
      const place = places[geonameid];
      if (!place) continue;
      const ring = tess[geonameid];
      if (ring) {
        features.push({
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [ring],
          },
          properties: { geonameid, name: place.name, status: "RU" },
        });
      } else {
        features.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: [place.lng, place.lat] },
          properties: { geonameid, name: place.name, status: "RU" },
        });
      }
    }

    for (const geonameid of snapshot.c) {
      const place = places[geonameid];
      if (!place) continue;
      const ring = tess[geonameid];
      if (ring) {
        features.push({
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [ring],
          },
          properties: { geonameid, name: place.name, status: "CONTESTED" },
        });
      } else {
        features.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: [place.lng, place.lat] },
          properties: { geonameid, name: place.name, status: "CONTESTED" },
        });
      }
    }

    // Compute frontline from boundary edges of all occupied polygons
    const allOccupiedIds = [...snapshot.r, ...snapshot.c];
    const frontline = computeFrontline(allOccupiedIds, tess);
    if (frontline) {
      features.push(frontline);
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
          "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
        },
      },
    );
  } catch {
    return NextResponse.json({ error: "Failed to load VIINA territory data" }, { status: 500 });
  }
}
