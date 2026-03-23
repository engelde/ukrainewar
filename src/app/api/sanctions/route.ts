import { NextResponse } from "next/server";
import { getSanctionsByDate, SANCTIONS_PACKAGES, SANCTIONS_SUMMARY } from "@/data/sanctions";

/**
 * GET /api/sanctions
 *
 * Returns curated sanctions data. Static dataset — served with long cache TTL.
 *
 * Query params:
 *   - asOf (optional): YYYYMMDD — return only packages imposed on or before this date.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const asOf = searchParams.get("asOf");

  const packages = asOf ? getSanctionsByDate(asOf) : SANCTIONS_PACKAGES;

  return NextResponse.json(
    { packages, summary: SANCTIONS_SUMMARY },
    {
      headers: {
        "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
        "X-Cache": "STATIC",
      },
    },
  );
}
