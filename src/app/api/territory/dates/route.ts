import { NextResponse } from "next/server";
import prebuildDates from "../../../../../public/data/territory-dates.json";

/**
 * GET /api/territory/dates
 *
 * Returns available DeepState territory map dates.
 * Pre-fetched at build time via `scripts/prebuild-territory-dates.ts`
 * to avoid runtime GitHub API calls.
 */
export async function GET() {
  return NextResponse.json(prebuildDates, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
    },
  });
}
