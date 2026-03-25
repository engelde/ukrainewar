import { type NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * GET /api/territory/viina?date=YYYYMMDD
 *
 * Serves pre-computed VIINA territory snapshots from static assets.
 * Computation happens at build time via `scripts/prebuild-viina.ts`.
 * Each snapshot contains territory polygons, point markers, and frontline.
 */

let indexCache: string[] | null = null;
const resultCache = new Map<string, unknown>();

function findClosestDate(dates: string[], target: string): string | null {
  if (dates.length === 0) return null;
  if (target <= dates[0]) return dates[0];
  if (target >= dates[dates.length - 1]) return dates[dates.length - 1];

  let lo = 0;
  let hi = dates.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (dates[mid] === target) return dates[mid];
    if (dates[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return dates[hi];
}

export async function GET(request: NextRequest) {
  const limited = checkRateLimit(request, "territory-viina", 120, 60_000);
  if (limited) return limited;

  const date = request.nextUrl.searchParams.get("date");

  if (!date || !/^\d{8}$/.test(date)) {
    return NextResponse.json({ error: "date parameter required (YYYYMMDD)" }, { status: 400 });
  }

  // Check result cache first
  const cached = resultCache.get(date);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
        "X-Cache": "HIT",
      },
    });
  }

  try {
    const origin = new URL(request.url).origin;

    // Load snapshot index
    if (!indexCache) {
      const res = await fetch(`${origin}/data/viina/snapshots/index.json`);
      if (!res.ok) throw new Error(`Failed to load snapshot index: ${res.status}`);
      indexCache = await res.json();
    }

    const closestDate = findClosestDate(indexCache!, date);
    if (!closestDate) {
      return NextResponse.json({ error: "No VIINA data available" }, { status: 404 });
    }

    // Fetch pre-computed snapshot
    const res = await fetch(`${origin}/data/viina/snapshots/${closestDate}.json`);
    if (!res.ok) {
      return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
    }

    const result = await res.json();

    // Cache for subsequent requests to same date
    resultCache.set(date, result);
    if (resultCache.size > 30) {
      const oldest = resultCache.keys().next().value!;
      resultCache.delete(oldest);
    }

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
        "X-Cache": "MISS",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load VIINA territory data" }, { status: 500 });
  }
}
