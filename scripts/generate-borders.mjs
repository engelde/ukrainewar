#!/usr/bin/env node

/**
 * Generate high-accuracy border GeoJSON files for Ukraine and Russia.
 *
 * Source: GADM 4.1 Level 0 boundaries (https://gadm.org)
 * - Ukraine: full resolution (~9K pts, 64 polygons including Crimea)
 * - Russia: simplified to web-friendly size, then shared-boundary points
 *   snapped to Ukraine's exact coordinates for perfect alignment
 *
 * Output:
 *   public/data/geo/ukraine-border.json  — Ukraine MultiPolygon (incl. Crimea)
 *   public/data/geo/russia-border.json   — Russia MultiPolygon (excl. Crimea, snapped)
 *   public/data/geo/ukraine-mask.json    — World polygon with Ukraine holes (for dim overlay)
 *
 * Usage: node scripts/generate-borders.mjs
 */

import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";

const GADM_UA_URL = "https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_UKR_0.json";
const GADM_RU_URL = "https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_RUS_0.json";
const UA_PATH = "/tmp/gadm_ukr.json";
const RU_PATH = "/tmp/gadm_rus.json";
const OUT_DIR = new URL("../public/data/geo/", import.meta.url).pathname;

// ── Configuration ────────────────────────────────────────────────────────

/** Douglas-Peucker tolerance for Russia simplification (degrees). */
const SIMPLIFY_TOLERANCE = 0.004;

/** Minimum polygon area to keep (sq degrees). Filters tiny islands. */
const MIN_POLYGON_AREA = 0.0005;

/** Snap threshold: Russia points within this distance of Ukraine border
 *  are snapped to exact Ukraine coordinates (degrees, ~1.5km). */
const SNAP_THRESHOLD = 0.015;

/** Grid cell size for spatial index (degrees). */
const GRID_CELL = 0.05;

// ── Helpers ──────────────────────────────────────────────────────────────

function download(url, path) {
  if (existsSync(path)) {
    console.log(`  Cached: ${path}`);
    return;
  }
  console.log(`  Downloading ${url}...`);
  execSync(`curl -sL -o "${path}" "${url}"`, { stdio: "inherit" });
}

function countPoints(geom) {
  let n = 0;
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  for (const poly of polys) for (const ring of poly) n += ring.length;
  return n;
}

function countPolygons(geom) {
  return geom.type === "Polygon" ? 1 : geom.coordinates.length;
}

function ringArea(ring) {
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    area += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return Math.abs(area) / 2;
}

// ── Douglas-Peucker simplification ──────────────────────────────────────

function simplifyRing(ring, tol) {
  if (ring.length <= 4) return ring;
  const tolSq = tol * tol;
  const kept = new Uint8Array(ring.length);
  kept[0] = 1;
  kept[ring.length - 1] = 1;

  const stack = [[0, ring.length - 1]];
  while (stack.length > 0) {
    const [first, last] = stack.pop();
    let maxDistSq = 0;
    let maxIdx = 0;
    const [x1, y1] = ring[first];
    const [x2, y2] = ring[last];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;

    for (let i = first + 1; i < last; i++) {
      let distSq;
      if (lenSq === 0) {
        distSq = (ring[i][0] - x1) ** 2 + (ring[i][1] - y1) ** 2;
      } else {
        const t = Math.max(
          0,
          Math.min(1, ((ring[i][0] - x1) * dx + (ring[i][1] - y1) * dy) / lenSq),
        );
        distSq = (ring[i][0] - (x1 + t * dx)) ** 2 + (ring[i][1] - (y1 + t * dy)) ** 2;
      }
      if (distSq > maxDistSq) {
        maxDistSq = distSq;
        maxIdx = i;
      }
    }

    if (maxDistSq > tolSq) {
      kept[maxIdx] = 1;
      if (maxIdx - first > 1) stack.push([first, maxIdx]);
      if (last - maxIdx > 1) stack.push([maxIdx, last]);
    }
  }

  const result = [];
  for (let i = 0; i < ring.length; i++) {
    if (kept[i]) result.push(ring[i]);
  }
  if (
    result[0][0] !== result[result.length - 1][0] ||
    result[0][1] !== result[result.length - 1][1]
  ) {
    result.push(result[0]);
  }
  return result;
}

function simplifyGeometry(geom, tol) {
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  const out = [];
  for (const poly of polys) {
    const rings = [];
    for (const ring of poly) {
      const s = simplifyRing(ring, tol);
      if (s.length >= 4) rings.push(s);
    }
    if (rings.length > 0) out.push(rings);
  }
  return { type: "MultiPolygon", coordinates: out };
}

// ── Spatial grid index for fast nearest-point lookups ────────────────────

function buildGrid(points) {
  const grid = new Map();
  for (const pt of points) {
    const key = `${Math.floor(pt[0] / GRID_CELL)},${Math.floor(pt[1] / GRID_CELL)}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(pt);
  }
  return grid;
}

function findNearest(grid, lng, lat, threshold) {
  const cx = Math.floor(lng / GRID_CELL);
  const cy = Math.floor(lat / GRID_CELL);
  const threshSq = threshold * threshold;
  let best = null;
  let bestDistSq = threshSq;

  // Search 3×3 grid neighborhood
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const key = `${cx + dx},${cy + dy}`;
      const cell = grid.get(key);
      if (!cell) continue;
      for (const pt of cell) {
        const dSq = (lng - pt[0]) ** 2 + (lat - pt[1]) ** 2;
        if (dSq < bestDistSq) {
          bestDistSq = dSq;
          best = pt;
        }
      }
    }
  }
  return best;
}

// ── Geometry operations ──────────────────────────────────────────────────

function filterSmallPolygons(geom, minArea) {
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  const kept = polys.filter((p) => ringArea(p[0]) >= minArea);
  if (kept.length === 0) return geom;
  return { type: "MultiPolygon", coordinates: kept };
}

function isInCrimea(pt) {
  return pt[0] > 32.4 && pt[0] < 36.7 && pt[1] > 44.2 && pt[1] < 46.3;
}

function removeCrimea(geom) {
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  const kept = polys.filter((poly) => {
    let crimeaPts = 0;
    for (const pt of poly[0]) {
      if (isInCrimea(pt)) crimeaPts++;
    }
    return crimeaPts < poly[0].length * 0.3;
  });
  if (kept.length === 0) return geom;
  return { type: "MultiPolygon", coordinates: kept };
}

function snapToUkraine(ruGeom, uaGeom) {
  // Collect all Ukraine border points
  const uaPoints = [];
  const uaPolys = uaGeom.type === "Polygon" ? [uaGeom.coordinates] : uaGeom.coordinates;
  for (const poly of uaPolys) {
    for (const ring of poly) {
      for (const pt of ring) uaPoints.push(pt);
    }
  }

  console.log(`   Building spatial index for ${uaPoints.length} Ukraine border points...`);
  const grid = buildGrid(uaPoints);

  const ruPolys = ruGeom.type === "Polygon" ? [ruGeom.coordinates] : ruGeom.coordinates;
  let snappedCount = 0;
  let totalChecked = 0;

  const out = [];
  for (const poly of ruPolys) {
    const newPoly = [];
    for (const ring of poly) {
      const newRing = [];
      for (const pt of ring) {
        totalChecked++;
        const nearest = findNearest(grid, pt[0], pt[1], SNAP_THRESHOLD);
        if (nearest) {
          newRing.push([nearest[0], nearest[1]]);
          snappedCount++;
        } else {
          newRing.push(pt);
        }
      }
      // Ensure closure
      const last = newRing[newRing.length - 1];
      if (newRing[0][0] !== last[0] || newRing[0][1] !== last[1]) {
        newRing.push([newRing[0][0], newRing[0][1]]);
      }
      newPoly.push(newRing);
    }
    out.push(newPoly);
  }

  console.log(
    `   Snapped ${snappedCount.toLocaleString()} / ${totalChecked.toLocaleString()} points to Ukraine coordinates`,
  );
  return { type: "MultiPolygon", coordinates: out };
}

function createMask(geom) {
  const worldRing = [
    [-180, -90],
    [180, -90],
    [180, 90],
    [-180, 90],
    [-180, -90],
  ];
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  const holes = [];
  for (const poly of polys) {
    const ring = poly[0];
    let area = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      area += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    }
    holes.push(area > 0 ? [...ring].reverse() : ring);
  }
  return { type: "Polygon", coordinates: [worldRing, ...holes] };
}

// ── Main ─────────────────────────────────────────────────────────────────

console.log("=== Border GeoJSON Generator ===\n");

console.log("1. Downloading GADM 4.1 data...");
download(GADM_UA_URL, UA_PATH);
download(GADM_RU_URL, RU_PATH);

console.log("\n2. Loading GeoJSON...");
const uaRaw = JSON.parse(readFileSync(UA_PATH, "utf8"));
const ruRaw = JSON.parse(readFileSync(RU_PATH, "utf8"));
const uaGeom = uaRaw.features[0].geometry;
let ruGeom = ruRaw.features[0].geometry;
console.log(
  `   Ukraine: ${countPoints(uaGeom).toLocaleString()} pts, ${countPolygons(uaGeom)} polys`,
);
console.log(
  `   Russia:  ${countPoints(ruGeom).toLocaleString()} pts, ${countPolygons(ruGeom)} polys`,
);

console.log("\n3. Removing Crimea from Russia...");
ruGeom = removeCrimea(ruGeom);
console.log(
  `   Russia: ${countPoints(ruGeom).toLocaleString()} pts, ${countPolygons(ruGeom)} polys`,
);

console.log("\n4. Filtering tiny island polygons...");
const before = countPolygons(ruGeom);
ruGeom = filterSmallPolygons(ruGeom, MIN_POLYGON_AREA);
console.log(
  `   Russia: ${before} → ${countPolygons(ruGeom)} polys (removed ${before - countPolygons(ruGeom)} tiny islands)`,
);

console.log(`\n5. Simplifying Russia (tol=${SIMPLIFY_TOLERANCE})...`);
ruGeom = simplifyGeometry(ruGeom, SIMPLIFY_TOLERANCE);
console.log(`   Russia: ${countPoints(ruGeom).toLocaleString()} pts`);

console.log("\n6. Snapping Russia border to Ukraine coordinates...");
ruGeom = snapToUkraine(ruGeom, uaGeom);

console.log("\n7. Verifying shared boundary alignment...");
const uaSet = new Set();
const uaCds = uaGeom.type === "Polygon" ? [uaGeom.coordinates] : uaGeom.coordinates;
for (const poly of uaCds)
  for (const ring of poly)
    for (const pt of ring) {
      if (pt[0] > 35 && pt[0] < 41 && pt[1] > 44 && pt[1] < 53) uaSet.add(`${pt[0]},${pt[1]}`);
    }
const ruCds = ruGeom.type === "Polygon" ? [ruGeom.coordinates] : ruGeom.coordinates;
let ruBorderPts = 0,
  shared = 0;
for (const poly of ruCds)
  for (const ring of poly)
    for (const pt of ring) {
      if (pt[0] > 35 && pt[0] < 41 && pt[1] > 44 && pt[1] < 53) {
        ruBorderPts++;
        if (uaSet.has(`${pt[0]},${pt[1]}`)) shared++;
      }
    }
console.log(
  `   RU border pts: ${ruBorderPts}, shared w/ Ukraine: ${shared} (${((shared / ruBorderPts) * 100).toFixed(0)}%)`,
);

console.log("\n8. Generating mask...");
const maskGeom = createMask(uaGeom);

console.log("\n9. Writing files...");
const write = (name, geom, props) => {
  const fc = {
    type: "FeatureCollection",
    features: [{ type: "Feature", properties: props, geometry: geom }],
  };
  const json = JSON.stringify(fc);
  writeFileSync(`${OUT_DIR}/${name}`, json);
  const pts = name.includes("mask") ? "-" : countPoints(geom).toLocaleString();
  console.log(`   ${name}: ${(json.length / 1024).toFixed(0)} KB, ${pts} pts`);
};

write("ukraine-border.json", uaGeom, { name: "Ukraine", iso_a3: "UKR" });
write("russia-border.json", ruGeom, { name: "Russia", iso_a3: "RUS" });
write("ukraine-mask.json", maskGeom, { name: "Ukraine Mask" });

console.log("\n✅ Border GeoJSON files generated successfully.");
console.log("   Source: GADM 4.1 (https://gadm.org)");
console.log("   Crimea: assigned to Ukraine per international recognition");
console.log("   Shared boundary: snapped to Ukraine's exact coordinates");
