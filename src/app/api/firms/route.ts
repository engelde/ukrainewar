import { NextResponse } from "next/server";
import { cacheGet, cacheSet, isFresh, isUsableStale } from "@/lib/cache";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * NASA FIRMS (Fire Information for Resource Management System) proxy.
 *
 * Fetches VIIRS satellite thermal anomaly data for Ukraine's bounding box.
 * These detections correlate with missile strikes, drone attacks, and fires.
 *
 * API: https://firms.modaps.eosdis.nasa.gov/api/area/
 * Bounding box: west=22, south=44, east=41, north=53 (covers all of Ukraine)
 *
 * Supports two modes:
 * - Near-real-time (no date param): VIIRS_SNPP_NRT, last 2 days
 * - Historical (date=YYYYMMDD):     VIIRS_SNPP_SP archive, 1-day window
 *
 * Returns GeoJSON FeatureCollection of thermal anomalies with confidence filtering.
 */

// Ukraine bounding box (generous to capture border areas)
const BBOX = "22,44,41,53";

// NASA FIRMS MAP_KEY — free, register at https://firms.modaps.eosdis.nasa.gov/api/area/
// A real API key is REQUIRED for area queries. DEMO_KEY is heavily rate-limited
// and does not reliably return data for bounding-box requests.
// Set the NASA_FIRMS_KEY environment variable with a registered key.
const MAP_KEY = process.env.NASA_FIRMS_KEY || "DEMO_KEY";

interface FirmsRecord {
  latitude: string;
  longitude: string;
  bright_ti4: string; // NRT & SP both use this column name
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
        brightness: Number.parseFloat(r.bright_ti4),
        confidence: r.confidence,
        frp: Number.parseFloat(r.frp), // Fire Radiative Power (MW)
        date: r.acq_date,
        time: r.acq_time,
        daynight: r.daynight,
      },
    })),
  };
}

/** Convert YYYYMMDD → YYYY-MM-DD for FIRMS API */
function toIsoDate(d: string): string {
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}

/** Days between two YYYYMMDD strings */
function daysBetween(a: string, b: string): number {
  const da = new Date(toIsoDate(a));
  const db = new Date(toIsoDate(b));
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

/** Today in YYYYMMDD */
function todayYMD(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

// In-flight request deduplication — concurrent requests for the same date share one outbound call
const inflight = new Map<string, Promise<GeoJSON.FeatureCollection>>();

async function fetchFirmsData(
  dateParam: string | null,
): Promise<{ geojson: GeoJSON.FeatureCollection; source: string; isRecent: boolean }> {
  const today = todayYMD();
  const isRecent = !dateParam || daysBetween(dateParam, today) <= 2;
  const source = isRecent ? "VIIRS_SNPP_NRT" : "VIIRS_SNPP_SP";
  const days = isRecent ? 2 : 1;
  const cacheKey = isRecent ? "firms:ukraine:nrt" : `firms:ukraine:${dateParam}`;
  const cacheTTL = isRecent ? 3 * 60 * 60 : 30 * 24 * 60 * 60;

  // Check persistent cache first
  const cached = await cacheGet<GeoJSON.FeatureCollection>(cacheKey);
  if (cached && isFresh(cached)) {
    return { geojson: cached.data, source, isRecent };
  }

  // Check if an identical outbound request is already in-flight
  if (inflight.has(cacheKey)) {
    const geojson = await inflight.get(cacheKey)!;
    return { geojson, source, isRecent };
  }

  // Make the outbound call, sharing the promise with concurrent callers
  const promise = (async () => {
    let url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${MAP_KEY}/${source}/${BBOX}/${days}`;
    if (!isRecent && dateParam) {
      url += `/${toIsoDate(dateParam)}`;
    }

    const res = await fetch(url, {
      headers: { Accept: "text/csv" },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      if (cached && isUsableStale(cached)) return cached.data;
      throw new Error(`NASA FIRMS returned ${res.status}`);
    }

    const csv = await res.text();
    const records = csvToRecords(csv);
    const geojson = toGeoJSON(records);

    await cacheSet(cacheKey, geojson, cacheTTL);
    return geojson;
  })();

  inflight.set(cacheKey, promise);
  try {
    const geojson = await promise;
    return { geojson, source, isRecent };
  } finally {
    inflight.delete(cacheKey);
  }
}

export async function GET(request: Request) {
  const limited = checkRateLimit(request, "firms", 60, 60_000);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date"); // YYYYMMDD

  try {
    if (MAP_KEY === "DEMO_KEY") {
      const empty: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };
      return NextResponse.json(empty, {
        headers: {
          "X-Cache": "SKIP",
          "X-Firms-Key": "DEMO_KEY",
          "Cache-Control": "public, max-age=300",
        },
      });
    }

    const { geojson, source, isRecent } = await fetchFirmsData(dateParam);

    return NextResponse.json(geojson, {
      headers: {
        "X-Cache": inflight.has(dateParam ? `firms:ukraine:${dateParam}` : "firms:ukraine:nrt")
          ? "DEDUP"
          : "MISS",
        "X-Firms-Source": source,
        "Cache-Control": `public, max-age=${isRecent ? 1800 : 86400}`,
      },
    });
  } catch (err) {
    console.error("[firms] Error fetching thermal data:", err);
    const cacheKey = dateParam ? `firms:ukraine:${dateParam}` : "firms:ukraine:nrt";
    const cached = await cacheGet<GeoJSON.FeatureCollection>(cacheKey);
    if (cached && isUsableStale(cached)) {
      return NextResponse.json(cached.data, {
        headers: { "X-Cache": "STALE-ERROR", "Cache-Control": "public, max-age=300" },
      });
    }
    return NextResponse.json({ error: "Failed to fetch thermal anomaly data" }, { status: 500 });
  }
}
