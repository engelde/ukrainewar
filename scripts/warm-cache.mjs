#!/usr/bin/env node

/**
 * Cache warming script — pre-fetches ACLED data and writes to .cache/
 * so the dev server (and production KV) never need to cold-start from the
 * extremely slow ACLED API (~25s per request).
 *
 * Usage:  node scripts/warm-cache.mjs
 *         npm run cache:warm
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const CACHE_DIR = join(PROJECT_ROOT, ".cache");

// Load .env.local
config({ path: join(PROJECT_ROOT, ".env.local") });

const ACLED_API = "https://acleddata.com/api/acled/read";
const ACLED_AUTH_URL = "https://acleddata.com/oauth/token";
const ACLED_EMAIL = process.env.ACLED_EMAIL;
const ACLED_PASSWORD = process.env.ACLED_PASSWORD;

const CACHE_TTL = {
  ACLED: 24 * 60 * 60,
  EVENTS: 24 * 60 * 60,
};

// Map fields (no notes — lightweight)
const MAP_FIELDS =
  "event_id_cnty|event_date|event_type|sub_event_type|actor1|actor2|location|latitude|longitude|fatalities|admin1";

function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function writeCacheFile(key, data, ttlSeconds) {
  ensureCacheDir();
  const safeName = key.replace(/[^a-zA-Z0-9_-]/g, "_");
  const entry = { data, timestamp: Date.now(), ttl: ttlSeconds };
  const fp = join(CACHE_DIR, `${safeName}.json`);
  writeFileSync(fp, JSON.stringify(entry));
  const sizeMB = (Buffer.byteLength(JSON.stringify(entry)) / 1024 / 1024).toFixed(2);
  console.log(`  Wrote ${fp} (${sizeMB} MB)`);
}

async function getAccessToken() {
  if (!ACLED_EMAIL || !ACLED_PASSWORD) {
    throw new Error("ACLED_EMAIL and ACLED_PASSWORD must be set in .env.local");
  }

  console.log("Authenticating with ACLED...");
  const res = await fetch(ACLED_AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "UkraineWarTracker/1.0",
    },
    body: new URLSearchParams({
      username: ACLED_EMAIL,
      password: ACLED_PASSWORD,
      grant_type: "password",
      client_id: "acled",
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Auth failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  console.log(`  Token obtained (expires in ${json.expires_in}s)`);
  return json.access_token;
}

function getDefaultDateRange() {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  return {
    start: "2022-02-24",
    end: cutoff.toISOString().slice(0, 10),
  };
}

async function fetchAcledPages(token, start, end, extraParams = {}) {
  const events = [];
  const seen = new Set();
  let page = 0;
  const limit = 10000;

  while (true) {
    const params = new URLSearchParams({
      country: "Ukraine",
      event_date: `${start}|${end}`,
      event_date_where: "BETWEEN",
      limit: String(limit),
      offset: String(page * limit),
      fields: MAP_FIELDS,
      ...extraParams,
    });

    const url = `${ACLED_API}?${params.toString()}`;
    console.log(`  Fetching page ${page + 1}...`);
    const startTime = Date.now();

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "UkraineWarTracker/1.0",
      },
      signal: AbortSignal.timeout(120000),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`ACLED API error (${res.status}): ${text}`);
    }

    const json = await res.json();
    const rows = json.data || [];
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (rows.length === 0) {
      console.log(`  Page ${page + 1}: 0 rows (${elapsed}s)`);
      break;
    }

    let newEvents = 0;
    for (const row of rows) {
      if (seen.has(row.event_id_cnty)) continue;
      seen.add(row.event_id_cnty);

      const lat = parseFloat(row.latitude);
      const lng = parseFloat(row.longitude);
      if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) continue;

      events.push({
        event_id: row.event_id_cnty,
        event_date: row.event_date,
        event_type: row.event_type,
        sub_event_type: row.sub_event_type,
        actor1: row.actor1 || "",
        actor2: row.actor2 || "",
        location: row.location || "",
        latitude: lat,
        longitude: lng,
        fatalities: parseInt(row.fatalities, 10) || 0,
        notes: "",
        admin1: row.admin1 || "",
      });
      newEvents++;
    }

    console.log(`  Page ${page + 1}: ${rows.length} rows, ${newEvents} new (${elapsed}s)`);

    // Stop if no new unique events (ACLED pagination bug returns duplicates with filters)
    if (newEvents === 0) break;
    if (rows.length < limit) break;
    page++;
  }

  return events;
}

function toGeoJSON(events) {
  return {
    type: "FeatureCollection",
    features: events.map((e) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [e.longitude, e.latitude],
      },
      properties: {
        id: e.event_id,
        date: e.event_date,
        type: e.event_type,
        subtype: e.sub_event_type,
        actor1: e.actor1,
        actor2: e.actor2,
        location: e.location,
        fatalities: e.fatalities,
        admin1: e.admin1,
      },
    })),
  };
}

async function warmAcledMapData(token) {
  const { start, end } = getDefaultDateRange();
  console.log(`\nWarming ACLED map data (${start} to ${end}, fatalities >= 5)...`);

  const events = await fetchAcledPages(token, start, end, {
    fatalities: "5",
    fatalities_where: ">=",
  });

  const geojson = toGeoJSON(events);
  console.log(`  Total events: ${geojson.features.length}`);

  const cacheKey = `acled-map:${start}:${end}`;
  writeCacheFile(cacheKey, geojson, CACHE_TTL.ACLED);
}

async function warmAcledEventsData(token) {
  const { start, end } = getDefaultDateRange();
  console.log(`\nWarming ACLED key events (${start} to ${end}, fatalities >= 50)...`);

  // High-impact events for the sidebar
  const events = await fetchAcledPages(token, start, end, {
    fatalities: "50",
    fatalities_where: ">=",
  });

  console.log(`  Total key events: ${events.length}`);
  const cacheKey = `acled-events:${start}:${end}`;
  writeCacheFile(cacheKey, events, CACHE_TTL.EVENTS);
}

async function main() {
  console.log("=== Cache Warming Script ===\n");

  try {
    const token = await getAccessToken();

    await warmAcledMapData(token);
    await warmAcledEventsData(token);

    console.log("\nCache warming complete!");
  } catch (err) {
    console.error("\nFailed:", err.message);
    process.exit(1);
  }
}

main();
