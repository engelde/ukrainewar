import { NextResponse } from "next/server";

const UNHCR_API = "https://api.unhcr.org/population/v1/population";

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v !== "-") return parseInt(v) || 0;
  return 0;
}

interface UNHCRItem {
  year?: number;
  coa_name?: string;
  coa_iso?: string;
  refugees?: number | string;
  asylum_seekers?: number | string;
  returned_refugees?: number | string;
  idps?: number | string;
  returned_idps?: number | string;
  stateless?: number | string;
  ooc?: number | string;
}

export async function GET() {
  try {
    const [yearlyRes, countryRes] = await Promise.all([
      fetch(`${UNHCR_API}/?coo=UKR&yearFrom=2022&yearTo=2026&limit=10`, {
        next: { revalidate: 86400 },
      }),
      fetch(`${UNHCR_API}/?coo=UKR&year=2024&coa_all=true&limit=100`, {
        next: { revalidate: 86400 },
      }),
    ]);

    if (!yearlyRes.ok || !countryRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch UNHCR data" },
        { status: 502 }
      );
    }

    const [yearlyData, countryData] = await Promise.all([
      yearlyRes.json(),
      countryRes.json(),
    ]);

    const yearly = (yearlyData.items || [])
      .filter((item: UNHCRItem) => item.year)
      .map((item: UNHCRItem) => ({
        year: item.year,
        refugees: toNum(item.refugees),
        asylum_seekers: toNum(item.asylum_seekers),
        returned_refugees: toNum(item.returned_refugees),
        idps: toNum(item.idps),
        returned_idps: toNum(item.returned_idps),
        stateless: toNum(item.stateless),
        others_of_concern: toNum(item.ooc),
      }))
      .sort((a: { year: number }, b: { year: number }) => a.year - b.year);

    const countries = (countryData.items || [])
      .filter(
        (item: UNHCRItem) =>
          item.coa_name &&
          item.coa_name !== "-" &&
          toNum(item.refugees) > 0
      )
      .map((item: UNHCRItem) => ({
        country: item.coa_name,
        iso: item.coa_iso,
        refugees: toNum(item.refugees),
        asylum_seekers: toNum(item.asylum_seekers),
      }))
      .sort(
        (a: { refugees: number }, b: { refugees: number }) =>
          b.refugees - a.refugees
      );

    const latest = yearly[yearly.length - 1] || {};
    const totalRefugees = countries.reduce(
      (sum: number, c: { refugees: number }) => sum + c.refugees,
      0
    );

    return NextResponse.json({
      summary: {
        total_refugees: totalRefugees || latest.refugees || 0,
        total_idps: latest.idps || 0,
        total_countries: countries.length,
        latest_year: latest.year || 2024,
      },
      yearly,
      countries,
      source: "UNHCR Refugee Data Finder",
      updated: new Date().toISOString(),
    });
  } catch (err) {
    console.error("UNHCR API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
