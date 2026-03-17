import { NextResponse } from "next/server";

const HDX_HAPI = "https://hapi.humdata.org/api/v2";
const APP_ID = Buffer.from("ukrainewar:contact@ukrainewar.app").toString("base64");

interface FundingItem {
  appeal_code: string;
  appeal_name: string;
  appeal_type: string;
  requirements_usd: number | null;
  funding_usd: number | null;
  funding_pct: number | null;
  reference_period_start: string;
  reference_period_end: string;
}

export async function GET() {
  try {
    const res = await fetch(
      `${HDX_HAPI}/coordination-context/funding?location_code=UKR&app_identifier=${APP_ID}&output_format=json&limit=50`,
      { next: { revalidate: 86400 } },
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch HDX funding data" }, { status: 502 });
    }

    const data = await res.json();

    // Filter to named appeals (not "Not specified") and war-era (2022+) with actual data
    const appeals = (data.data || [])
      .filter(
        (item: FundingItem) =>
          item.appeal_name &&
          !item.appeal_name.startsWith("Not specified") &&
          item.reference_period_start >= "2022" &&
          ((item.requirements_usd && item.requirements_usd > 0) ||
            (item.funding_usd && item.funding_usd > 0)),
      )
      .map((item: FundingItem) => ({
        code: item.appeal_code,
        name: item.appeal_name,
        type: item.appeal_type,
        requirements_usd: item.requirements_usd || 0,
        funding_usd: item.funding_usd || 0,
        funding_pct: item.funding_pct || 0,
        year: parseInt(item.reference_period_start.slice(0, 4), 10),
      }))
      .sort((a: { year: number }, b: { year: number }) => a.year - b.year);

    // Calculate totals
    const totalRequired = appeals.reduce(
      (sum: number, a: { requirements_usd: number }) => sum + a.requirements_usd,
      0,
    );
    const totalFunded = appeals.reduce(
      (sum: number, a: { funding_usd: number }) => sum + a.funding_usd,
      0,
    );

    return NextResponse.json({
      summary: {
        total_required_usd: totalRequired,
        total_funded_usd: totalFunded,
        overall_pct: totalRequired > 0 ? Math.round((totalFunded / totalRequired) * 100) : 0,
        appeal_count: appeals.length,
      },
      appeals,
      source: "HDX HAPI / OCHA Financial Tracking Service",
      updated: new Date().toISOString(),
    });
  } catch (err) {
    console.error("HDX Funding API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
