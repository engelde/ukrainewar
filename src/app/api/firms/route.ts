import { NextResponse } from "next/server";
import { cacheGet, cacheSet, isFresh, isUsableStale } from "@/lib/cache";

/**
 * NASA FIRMS (Fire Information for Resource Management System) proxy.
 *
 * Fetches VIIRS satellite thermal anomaly data for Ukraine's bounding box.
 * These detections correlate with missile strikes, drone attacks, and fires.
 *
 * API: https://firms.modaps.eosdis.nasa.gov/api/area/
 * Bounding box: west=22, south=44, east=41, north=53 (covers all of Ukraine)
 * Source: VIIRS_SNPP_NRT (near real-time, ~3h latency)
 *
 * Returns GeoJSON FeatureCollection of thermal anomalies with confidence filtering.
 */

const CACHE_KEY = "firms:ukraine";
const CACHE_TTL = 3 * 60 * 60; // 3 hours (satellite passes ~every 3h)

// Ukraine bounding box (generous to capture border areas)
const BBOX = "22,44,41,53";
const DAYS = 2; // Last 2 days of data

// NASA FIRMS MAP_KEY — free, register at https://firms.modaps.eosdis.nasa.gov/api/area/
// Using the default demo key; replace with registered key for production
const MAP_KEY = process.env.NASA_FIRMS_KEY || "DEMO_KEY";

interface FirmsRecord {
  latitude: string;
  longitude: string;
  brightness: string;
  scan: string;
  track: string;
  acq_date: string;
  acq_time: string;
  confidence: string;
  frp: string;
  daynight: string;
}

function csvToRecords(csv: string): FirmsRecord[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const record: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      record[headers[i]] = values[i]?.trim() || "";
    }
    return record as unknown as FirmsRecord;
  });
}

function toGeoJSON(records: FirmsRecord[]): GeoJSON.FeatureCollection {
  // Filter: only high/nominal confidence (skip "low" which includes agricultural burns)
  const filtered = records.filter(
    (r) =>
      r.confidence === "high" ||
      r.confidence === "nominal" ||
      r.confidence === "h" ||
      r.confidence === "n",
  );

  return {
    type: "FeatureCollection",
    features: filtered.map((r) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [Number.parseFloat(r.longitude), Number.parseFloat(r.latitude)],
      },
      properties: {
        brightness: Number.parseFloat(r.brightness),
        confidence: r.confidence,
        frp: Number.parseFloat(r.frp), // Fire Radiative Power (MW)
        date: r.acq_date,
        time: r.acq_time,
        daynight: r.daynight,
      },
    })),
  };
}

export async function GET() {
  try {
    // Check cache first
    const cached = await cacheGet<GeoJSON.FeatureCollection>(CACHE_KEY);
    if (cached && isFresh(cached)) {
      return NextResponse.json(cached.data, {
        headers: { "X-Cache": "HIT", "Cache-Control": "public, max-age=1800" },
      });
    }

    // Fetch from NASA FIRMS
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${MAP_KEY}/VIIRS_SNPP_NRT/${BBOX}/${DAYS}`;
    const res = await fetch(url, {
      headers: { Accept: "text/csv" },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      // Serve stale if available
      if (cached && isUsableStale(cached)) {
        return NextResponse.json(cached.data, {
          headers: { "X-Cache": "STALE", "Cache-Control": "public, max-age=300" },
        });
      }
      return NextResponse.json({ error: "NASA FIRMS API unavailable" }, { status: 502 });
    }

    const csv = await res.text();
    const records = csvToRecords(csv);
    const geojson = toGeoJSON(records);

    // Cache the result
    await cacheSet(CACHE_KEY, geojson, CACHE_TTL);

    return NextResponse.json(geojson, {
      headers: { "X-Cache": "MISS", "Cache-Control": "public, max-age=1800" },
    });
  } catch (err) {
    console.error("[firms] Error fetching thermal data:", err);
    // Try stale cache
    const cached = await cacheGet<GeoJSON.FeatureCollection>(CACHE_KEY);
    if (cached && isUsableStale(cached)) {
      return NextResponse.json(cached.data, {
        headers: { "X-Cache": "STALE-ERROR", "Cache-Control": "public, max-age=300" },
      });
    }
    return NextResponse.json({ error: "Failed to fetch thermal anomaly data" }, { status: 500 });
  }
}
