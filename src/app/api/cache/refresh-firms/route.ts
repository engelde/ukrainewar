import { type NextRequest, NextResponse } from "next/server";
import { cacheGet, isFresh } from "@/lib/cache";

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
 * Paces requests at 500ms intervals to be respectful to the NASA FIRMS API.
 */

const WAR_START = "20220224";

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
  const baseUrl = url.origin;

  const results: { date: string; status: string; ms: number }[] = [];
  let warmed = 0;
  let skipped = 0;
  let failed = 0;

  let current = startDate;
  while (current <= endDate) {
    const dateStr = toYMD(current);
    const cacheKey = `firms:ukraine:${dateStr}`;

    // Skip dates that are already cached and fresh
    const cached = await cacheGet<GeoJSON.FeatureCollection>(cacheKey);
    if (cached && isFresh(cached)) {
      skipped++;
      current = addDays(current, stepDays);
      continue;
    }

    // Fetch via the FIRMS route (reuses dedup + caching logic)
    const start = Date.now();
    try {
      const res = await fetch(`${baseUrl}/api/firms?date=${dateStr}`, {
        headers: { "User-Agent": "UkraineWarTracker-CacheWarmer/1.0" },
      });
      const elapsed = Date.now() - start;

      if (res.ok) {
        warmed++;
        results.push({ date: dateStr, status: "ok", ms: elapsed });
      } else {
        failed++;
        results.push({ date: dateStr, status: `http-${res.status}`, ms: elapsed });
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
