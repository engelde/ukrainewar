#!/usr/bin/env node

/**
 * VIINA Territory Control Data Processor
 *
 * Downloads VIINA control CSVs and tessellation GeoJSON from GitHub,
 * extracts only non-UA (RU/CONTESTED) data, and outputs compact
 * pre-processed files for the API route to serve.
 *
 * Output:
 *   public/data/viina/places.json      — {geonameid: {lat, lng, name}} for conflict-zone places
 *   public/data/viina/control.json     — weekly snapshots of territory control
 *
 * Usage: node scripts/process-viina.mjs
 */

import { execSync } from "child_process";
import fs, { createReadStream } from "fs";
import path from "path";
import { createInterface } from "readline";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "public", "data", "viina");
const CACHE_DIR = path.join(PROJECT_ROOT, ".cache", "viina");

const YEARS = ["2022", "2023", "2024", "2025", "2026"];
const VIINA_BASE = "https://github.com/zhukovyuri/VIINA/raw/main/Data";
const TESSELLATION_URL = `${VIINA_BASE}/gn_UA_tess.geojson`;

// Sample every N days for snapshots (7 = weekly)
const SAMPLE_INTERVAL = 7;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function downloadFile(url, dest) {
  if (fs.existsSync(dest)) {
    console.log(`  [cached] ${path.basename(dest)}`);
    return;
  }
  console.log(`  [downloading] ${url}`);
  execSync(`curl -sL "${url}" -o "${dest}"`, { stdio: "inherit" });
}

/**
 * Extract lat/lng/name from tessellation GeoJSON (only properties, skip geometries)
 */
async function extractPlaceCoordinates() {
  const tessPath = path.join(CACHE_DIR, "gn_UA_tess.geojson");
  await downloadFile(TESSELLATION_URL, tessPath);

  console.log("Parsing tessellation GeoJSON...");
  const raw = fs.readFileSync(tessPath, "utf8");
  const geojson = JSON.parse(raw);

  const places = {};
  for (const feature of geojson.features) {
    const props = feature.properties;
    const geonameid = Math.round(props.geonameid);
    places[geonameid] = {
      lat: parseFloat(props.latitude),
      lng: parseFloat(props.longitude),
      name: props.asciiname || props.name || "",
    };
  }
  console.log(`  Extracted ${Object.keys(places).length} place coordinates`);
  return places;
}

/**
 * Stream-parse a year's control CSV, collecting non-UA entries.
 * Returns Map<date, Map<geonameid, status>>
 */
async function processYearCSV(year) {
  const zipPath = path.join(CACHE_DIR, `control_latest_${year}.zip`);
  const csvPath = path.join(CACHE_DIR, `control_latest_${year}.csv`);

  await downloadFile(`${VIINA_BASE}/control_latest_${year}.zip`, zipPath);

  // Unzip if needed
  if (!fs.existsSync(csvPath)) {
    console.log(`  [unzipping] ${path.basename(zipPath)}`);
    execSync(`cd "${CACHE_DIR}" && unzip -o "${zipPath}"`, { stdio: "pipe" });
  }

  console.log(`  [parsing] control_latest_${year}.csv`);

  // Collect all unique dates and non-UA entries
  const dateEntries = new Map(); // date -> [{geonameid, status}]
  const nonUAIds = new Set();

  const fileStream = createReadStream(csvPath, { encoding: "utf8" });
  const rl = createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineCount = 0;
  let isHeader = true;

  for await (const line of rl) {
    if (isHeader) {
      isHeader = false;
      continue;
    }
    lineCount++;
    if (lineCount % 2_000_000 === 0) {
      console.log(`    ... processed ${(lineCount / 1_000_000).toFixed(1)}M rows`);
    }

    // CSV: geonameid,date,status_wiki,status_boost,status_dsm,status_isw,status,vcontrol_version
    const parts = line.split(",");
    const geonameid = parseInt(parts[0], 10);
    const date = parts[1];
    const status = parts[6]; // majority vote status

    if (status !== "UA") {
      nonUAIds.add(geonameid);

      if (!dateEntries.has(date)) {
        dateEntries.set(date, []);
      }
      dateEntries.get(date).push({ geonameid, status });
    }
  }

  console.log(
    `    ${lineCount.toLocaleString()} rows, ${dateEntries.size} unique dates, ${nonUAIds.size} non-UA places`,
  );

  return { dateEntries, nonUAIds };
}

/**
 * Main processing pipeline
 */
async function main() {
  console.log("=== VIINA Territory Control Processor ===\n");

  ensureDir(OUTPUT_DIR);
  ensureDir(CACHE_DIR);

  // Step 1: Extract place coordinates from tessellation
  console.log("\n[1/3] Extracting place coordinates...");
  const allPlaces = await extractPlaceCoordinates();

  // Step 2: Process all year CSVs
  console.log("\n[2/3] Processing control CSVs...");
  const allNonUAIds = new Set();
  const allDateEntries = new Map();

  for (const year of YEARS) {
    console.log(`\n  Year ${year}:`);
    try {
      const { dateEntries, nonUAIds } = await processYearCSV(year);

      for (const id of nonUAIds) allNonUAIds.add(id);
      for (const [date, entries] of dateEntries) {
        allDateEntries.set(date, entries);
      }
    } catch (err) {
      console.log(`    [skip] ${year}: ${err.message}`);
    }
  }

  // Step 3: Build output files
  console.log("\n[3/3] Building output files...");

  // Places: only include places that are ever non-UA
  const conflictPlaces = {};
  for (const id of allNonUAIds) {
    if (allPlaces[id]) {
      conflictPlaces[id] = allPlaces[id];
    }
  }
  console.log(`  Conflict zone places: ${Object.keys(conflictPlaces).length}`);

  // Control snapshots: sample every SAMPLE_INTERVAL days
  const sortedDates = [...allDateEntries.keys()].sort();
  console.log(`  Date range: ${sortedDates[0]} to ${sortedDates[sortedDates.length - 1]}`);
  console.log(`  Total dates with data: ${sortedDates.length}`);

  const snapshots = [];
  for (let i = 0; i < sortedDates.length; i += SAMPLE_INTERVAL) {
    const date = sortedDates[i];
    const entries = allDateEntries.get(date);

    const ru = [];
    const contested = [];
    for (const entry of entries) {
      if (entry.status === "RU") ru.push(entry.geonameid);
      else if (entry.status === "CONTESTED") contested.push(entry.geonameid);
    }

    snapshots.push({ d: date, r: ru, c: contested });
  }

  // Always include the last date
  const lastDate = sortedDates[sortedDates.length - 1];
  if (snapshots[snapshots.length - 1]?.d !== lastDate) {
    const entries = allDateEntries.get(lastDate);
    const ru = [];
    const contested = [];
    for (const entry of entries) {
      if (entry.status === "RU") ru.push(entry.geonameid);
      else if (entry.status === "CONTESTED") contested.push(entry.geonameid);
    }
    snapshots.push({ d: lastDate, r: ru, c: contested });
  }

  console.log(`  Weekly snapshots: ${snapshots.length}`);

  // Write places.json
  const placesPath = path.join(OUTPUT_DIR, "places.json");
  fs.writeFileSync(placesPath, JSON.stringify(conflictPlaces));
  const placesSize = (fs.statSync(placesPath).size / 1024).toFixed(0);
  console.log(`  places.json: ${placesSize} KB`);

  // Write control.json
  const controlPath = path.join(OUTPUT_DIR, "control.json");
  fs.writeFileSync(controlPath, JSON.stringify(snapshots));
  const controlSize = (fs.statSync(controlPath).size / 1024).toFixed(0);
  console.log(`  control.json: ${controlSize} KB`);

  console.log("\n=== Done! ===\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
