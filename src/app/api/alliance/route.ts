import { NextResponse } from "next/server";
import allianceData from "../../../../public/data/alliance.json";

/**
 * GET /api/alliance
 *
 * Serves pre-filtered alliance GeoJSON (countries by alignment).
 * Built at compile time via `scripts/prebuild-alliance.ts` from
 * the 19MB world GeoJSON, filtered to ~40 aligned countries.
 */
export async function GET() {
  return NextResponse.json(allianceData, {
    headers: {
      "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
    },
  });
}
