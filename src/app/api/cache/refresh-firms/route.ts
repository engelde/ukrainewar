import { type NextRequest, NextResponse } from "next/server";
import { cacheGet, cacheSet, isFresh, isUsableStale } from "@/lib/cache";

/**
 * POST /api/cache/refresh-firms
 *
 * Pre-warms the FIRMS thermal anomaly cache for historical dates.
 * Iterates every 7th day from the invasion start (2022-02-24) to today,
 * skipping dates that already have fresh cache entries.
 *
 * Called by the Cloudflare cron worker after regular endpoint warming.
 * Protected by the same CACHE_REFRESH_SECRET as /api/cache/refresh.
 *
 * Fetches directly from NASA FIRMS API (no self-fetch) to avoid the
 * Cloudflare Worker subrequest loop that causes 522 errors.
 *
 * Paces requests at 500ms intervals to be respectful to the NASA FIRMS API.
 */

const WAR_START = "20220224";
const BBOX = "22,44,41,53";

function toYMD(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function parseYMD(s: string): Date {
  return new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T00:00:00Z`);
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setUTCDate(result.getUTCDate() + n);
  return result;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toIsoDate(d: string): string {
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}

interface FirmsRecord {
  latitude: string;
  longitude: string;
  bright_ti4: string;
  confidence: string;
  frp: string;
  acq_date: string;
  acq_time: string;
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
        frp: Number.parseFloat(r.frp),
        date: r.acq_date,
        time: r.acq_time,
        daynight: r.daynight,
      },
    })),
  };
}

async function fetchAndCacheFirmsDate(dateStr: string): Promise<string> {
  const apiKey = process.env.NASA_FIRMS_KEY || "DEMO_KEY";
  if (apiKey === "DEMO_KEY") return "no-key";

  const cacheKey = `firms:ukraine:${dateStr}`;
  const cacheTTL = 30 * 24 * 60 * 60; // 30 days for historical

  // Check if already cached and fresh
  const cached = await cacheGet<GeoJSON.FeatureCollection>(cacheKey);
  if (cached && isFresh(cached)) return "skipped";

  // Fetch directly from NASA FIRMS (historical archive)
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${apiKey}/VIIRS_SNPP_SP/${BBOX}/1/${toIsoDate(dateStr)}`;
  const res = await fetch(url, {
    headers: { Accept: "text/csv" },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    // If we have stale data, keep it; otherwise mark as failed
    if (cached && isUsableStale(cached)) return "kept-stale";
    return `http-${res.status}`;
  }

  const csv = await res.text();
  const records = csvToRecords(csv);
  const geojson = toGeoJSON(records);
  await cacheSet(cacheKey, geojson, cacheTTL);
  return "ok";
}

export async function POST(request: NextRequest) {
  const secret = process.env.CACHE_REFRESH_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const startParam = url.searchParams.get("start") || WAR_START;
  const endParam = url.searchParams.get("end") || toYMD(new Date());
  const stepDays = Number.parseInt(url.searchParams.get("step") || "7", 10);

  const startDate = parseYMD(startParam);
  const endDate = parseYMD(endParam);

  const results: { date: string; status: string; ms: number }[] = [];
  let warmed = 0;
  let skipped = 0;
  let failed = 0;

  let current = startDate;
  while (current <= endDate) {
    const dateStr = toYMD(current);
    const start = Date.now();

    try {
      const status = await fetchAndCacheFirmsDate(dateStr);
      const elapsed = Date.now() - start;

      if (status === "ok") {
        warmed++;
        results.push({ date: dateStr, status: "ok", ms: elapsed });
      } else if (status === "skipped") {
        skipped++;
      } else if (status === "no-key") {
        return NextResponse.json({
          error: "NASA_FIRMS_KEY not configured",
          warmed,
          skipped,
          failed,
        });
      } else {
        failed++;
        results.push({ date: dateStr, status, ms: elapsed });
      }
    } catch (err) {
      failed++;
      results.push({
        date: dateStr,
        status: err instanceof Error ? err.message : "error",
        ms: Date.now() - start,
      });
    }

    // Pace requests to be respectful to NASA FIRMS API
    await sleep(500);
    current = addDays(current, stepDays);
  }

  return NextResponse.json({
    warmed,
    skipped,
    failed,
    total: warmed + skipped + failed,
    step: stepDays,
    range: { start: startParam, end: endParam },
    results: results.length > 50 ? results.slice(-50) : results,
  });
}
