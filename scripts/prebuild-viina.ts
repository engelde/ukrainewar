#!/usr/bin/env npx tsx
/**
 * Pre-computes VIINA territory snapshots into individual GeoJSON files.
 * Each snapshot includes territory polygons/points and frontline computation.
 * Output: public/data/viina/snapshots/{date}.json + index.json
 *
 * This runs at build time so the API endpoint can serve static files
 * instead of parsing 10MB+ of JSON and computing geometry in a Worker.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DATA_DIR = join(process.cwd(), "public", "data", "viina");
const OUT_DIR = join(DATA_DIR, "snapshots");

interface Place {
  lat: number;
  lng: number;
  name: string;
}

interface Snapshot {
  d: string;
  r: number[];
  c: number[];
}

type Tessellation = Record<string, number[][]>;

// Normalize an edge key so (A,B) and (B,A) produce the same string
function edgeKey(a: number[], b: number[]): string {
  const ax = a[0];
  const ay = a[1];
  const bx = b[0];
  const by = b[1];
  if (ax < bx || (ax === bx && ay < by)) return `${ax},${ay}|${bx},${by}`;
  return `${bx},${by}|${ax},${ay}`;
}

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

  const boundaryEdges: number[][][] = [];
  for (const edge of edgeCounts.values()) {
    if (edge.count === 1) {
      boundaryEdges.push([edge.a, edge.b]);
    }
  }

  if (boundaryEdges.length === 0) return null;

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

  const endpoints = [...adjacency.entries()].filter(([, n]) => n.neighbors.length !== 2);

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
      chain.push([...chain[0]]);
      lines.push(chain);
    }
  }

  if (lines.length === 0) return null;

  // Round frontline coordinates too
  const roundedLines = lines.map((line) => roundRing(line));

  return {
    type: "Feature",
    geometry: { type: "MultiLineString", coordinates: roundedLines },
    properties: { type: "frontline" },
  };
}

function buildSnapshot(snapshot: Snapshot, places: Record<string, Place>, tess: Tessellation) {
  const features: GeoJSON.Feature[] = [];

  for (const geonameid of snapshot.r) {
    const place = places[geonameid];
    if (!place) continue;
    const ring = tess[geonameid];
    if (ring) {
      features.push({
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [roundRing(ring)] },
        properties: { geonameid, name: place.name, status: "RU" },
      });
    } else {
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [roundCoord(place.lng), roundCoord(place.lat)] },
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
        geometry: { type: "Polygon", coordinates: [roundRing(ring)] },
        properties: { geonameid, name: place.name, status: "CONTESTED" },
      });
    } else {
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [roundCoord(place.lng), roundCoord(place.lat)] },
        properties: { geonameid, name: place.name, status: "CONTESTED" },
      });
    }
  }

  const allOccupiedIds = [...snapshot.r, ...snapshot.c];
  const frontline = computeFrontline(allOccupiedIds, tess);
  if (frontline) {
    features.push(frontline);
  }

  return {
    date: snapshot.d,
    snapshotDate: snapshot.d,
    geojson: { type: "FeatureCollection" as const, features },
    counts: { ru: snapshot.r.length, contested: snapshot.c.length },
  };
}

// Round coordinates to 4 decimal places (~11m accuracy) to reduce file sizes
function roundCoord(n: number): number {
  return Math.round(n * 10000) / 10000;
}
function roundRing(ring: number[][]): number[][] {
  return ring.map((c) => [roundCoord(c[0]), roundCoord(c[1])]);
}

// Main
console.log("Loading VIINA source data...");
const places: Record<string, Place> = JSON.parse(
  readFileSync(join(DATA_DIR, "places.json"), "utf-8"),
);
const control: Snapshot[] = JSON.parse(readFileSync(join(DATA_DIR, "control.json"), "utf-8"));
const tess: Tessellation = JSON.parse(readFileSync(join(DATA_DIR, "tessellation.json"), "utf-8"));

// Filter to valid war period dates
const CUTOFF = "20240708";
const validSnapshots = control.filter((s) => s.d >= "20220223" && s.d <= CUTOFF);

console.log(
  `Found ${validSnapshots.length} valid snapshots (${validSnapshots[0]?.d} to ${validSnapshots[validSnapshots.length - 1]?.d})`,
);

mkdirSync(OUT_DIR, { recursive: true });

const index: string[] = [];
let totalBytes = 0;

for (const snapshot of validSnapshots) {
  const result = buildSnapshot(snapshot, places, tess);
  const json = JSON.stringify(result);
  const outPath = join(OUT_DIR, `${snapshot.d}.json`);
  writeFileSync(outPath, json);
  index.push(snapshot.d);
  totalBytes += json.length;
  process.stdout.write(`\r  Computed ${index.length}/${validSnapshots.length} snapshots`);
}

console.log();

// Write index of available dates
writeFileSync(join(OUT_DIR, "index.json"), JSON.stringify(index));

const totalMB = (totalBytes / 1024 / 1024).toFixed(1);
console.log(
  `Done! ${index.length} snapshots written to public/data/viina/snapshots/ (${totalMB} MB total)`,
);
