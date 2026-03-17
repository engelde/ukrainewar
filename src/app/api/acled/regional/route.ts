import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

const HDX_DATASETS = {
  politicalViolence: {
    url: "https://data.humdata.org/dataset/7b36830b-c033-4a06-b812-9940baec603b/resource/e122ca1c-9463-4e3a-8731-8a85fab2a15e/download/ukraine_hrp_political_violence_events_and_fatalities_by_month-year_as-of-11mar2026.xlsx",
  },
  civilianTargeting: {
    url: "https://data.humdata.org/dataset/7b36830b-c033-4a06-b812-9940baec603b/resource/23755ad0-1d81-4b10-9e66-23b784ccd429/download/ukraine_hrp_civilian_targeting_events_and_fatalities_by_month-year_as-of-11mar2026.xlsx",
  },
  demonstrations: {
    url: "https://data.humdata.org/dataset/7b36830b-c033-4a06-b812-9940baec603b/resource/0f040d73-471e-4535-bef1-59ac09faa63c/download/ukraine_hrp_demonstration_events_by_month-year_as-of-11mar2026.xlsx",
  },
};

const MONTH_TO_NUM: Record<string, string> = {
  January: "01",
  February: "02",
  March: "03",
  April: "04",
  May: "05",
  June: "06",
  July: "07",
  August: "08",
  September: "09",
  October: "10",
  November: "11",
  December: "12",
};

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

let cachedData: Record<string, unknown> | null = null;
let cachedAt = 0;

interface AcledRow {
  Admin1?: string;
  "Admin1 Pcode"?: string;
  Month?: string;
  Year?: number;
  Events?: number;
  Fatalities?: number;
}

interface OblastData {
  pcode: string;
  months: Record<
    string,
    { events: number; fatalities: number; civilian: number; demos: number }
  >;
}

async function downloadXLSX(url: string): Promise<AcledRow[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HDX download failed: ${res.status}`);
  const buf = await res.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  return XLSX.utils.sheet_to_json<AcledRow>(wb.Sheets["Data"]);
}

function processRows(
  rows: AcledRow[],
  category: "pv" | "ct" | "demo",
  oblasts: Record<string, OblastData>,
  monthlyTotals: Record<
    string,
    { events: number; fatalities: number; civilian: number; demos: number }
  >,
  yearlyTotals: Record<
    string,
    { events: number; fatalities: number; civilian: number; demos: number }
  >
) {
  for (const row of rows) {
    const oblast = row.Admin1;
    const month = MONTH_TO_NUM[row.Month || ""];
    const year = String(row.Year);
    if (!oblast || !month || !year) continue;

    const key = `${year}-${month}`;
    const events = row.Events || 0;
    const fatalities = row.Fatalities || 0;

    if (!oblasts[oblast])
      oblasts[oblast] = { pcode: row["Admin1 Pcode"] || "", months: {} };
    if (!oblasts[oblast].months[key])
      oblasts[oblast].months[key] = {
        events: 0,
        fatalities: 0,
        civilian: 0,
        demos: 0,
      };

    if (category === "pv") {
      oblasts[oblast].months[key].events += events;
      oblasts[oblast].months[key].fatalities += fatalities;
    } else if (category === "ct") {
      oblasts[oblast].months[key].civilian += events;
    } else if (category === "demo") {
      oblasts[oblast].months[key].demos += events;
    }

    if (!monthlyTotals[key])
      monthlyTotals[key] = { events: 0, fatalities: 0, civilian: 0, demos: 0 };
    if (category === "pv") {
      monthlyTotals[key].events += events;
      monthlyTotals[key].fatalities += fatalities;
    } else if (category === "ct") {
      monthlyTotals[key].civilian += events;
    } else if (category === "demo") {
      monthlyTotals[key].demos += events;
    }

    if (!yearlyTotals[year])
      yearlyTotals[year] = { events: 0, fatalities: 0, civilian: 0, demos: 0 };
    if (category === "pv") {
      yearlyTotals[year].events += events;
      yearlyTotals[year].fatalities += fatalities;
    } else if (category === "ct") {
      yearlyTotals[year].civilian += events;
    } else if (category === "demo") {
      yearlyTotals[year].demos += events;
    }
  }
}

async function processAcledData(): Promise<Record<string, unknown>> {
  const [pvData, ctData, demoData] = await Promise.all([
    downloadXLSX(HDX_DATASETS.politicalViolence.url),
    downloadXLSX(HDX_DATASETS.civilianTargeting.url),
    downloadXLSX(HDX_DATASETS.demonstrations.url),
  ]);

  const oblasts: Record<string, OblastData> = {};
  const monthlyTotals: Record<
    string,
    { events: number; fatalities: number; civilian: number; demos: number }
  > = {};
  const yearlyTotals: Record<
    string,
    { events: number; fatalities: number; civilian: number; demos: number }
  > = {};

  processRows(pvData, "pv", oblasts, monthlyTotals, yearlyTotals);
  processRows(ctData, "ct", oblasts, monthlyTotals, yearlyTotals);
  processRows(demoData, "demo", oblasts, monthlyTotals, yearlyTotals);

  const oblastSummaries = Object.entries(oblasts)
    .map(([name, data]) => {
      let totalEvents = 0,
        totalFatalities = 0,
        totalCivilian = 0;
      for (const [key, m] of Object.entries(data.months)) {
        if (key >= "2022") {
          totalEvents += m.events;
          totalFatalities += m.fatalities;
          totalCivilian += m.civilian;
        }
      }
      return {
        name,
        pcode: data.pcode,
        totalEvents,
        totalFatalities,
        totalCivilian,
        monthly: Object.entries(data.months)
          .filter(([key]) => key >= "2022")
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, d]) => {
            const [y, m] = date.split("-");
            const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            return {
              month: monthNames[parseInt(m)] || date,
              year: parseInt(y),
              events: d.events,
              fatalities: d.fatalities,
            };
          }),
      };
    })
    .sort((a, b) => b.totalEvents - a.totalEvents);

  const timeline = Object.entries(monthlyTotals)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));

  let cumFatalities = 0;
  const cumulativeFatalities = timeline
    .filter((t) => t.date >= "2022-02")
    .map((t) => {
      cumFatalities += t.fatalities;
      return { date: t.date, fatalities: cumFatalities };
    });

  return {
    lastUpdated: new Date().toISOString().split("T")[0],
    oblasts: oblastSummaries,
    oblastMonthly: Object.fromEntries(
      Object.entries(oblasts).map(([name, data]) => [
        name,
        {
          pcode: data.pcode,
          months: Object.entries(data.months)
            .sort(([a], [b]) => a.localeCompare(b))
            .filter(([key]) => key >= "2022")
            .map(([date, d]) => ({ date, ...d })),
        },
      ])
    ),
    timeline,
    yearlyTotals: Object.entries(yearlyTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, data]) => ({ year, ...data })),
    cumulativeFatalities,
    source: {
      name: "ACLED via HDX",
      url: "https://data.humdata.org/dataset/ukraine-acled-conflict-data",
      attribution:
        "ACLED (Armed Conflict Location & Event Data Project). Licensed under CC-BY.",
    },
  };
}

export async function GET() {
  try {
    const now = Date.now();
    if (cachedData && now - cachedAt < CACHE_TTL) {
      return NextResponse.json(cachedData, {
        headers: {
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=3600",
          "X-Data-Source": "cache",
        },
      });
    }

    const data = await processAcledData();
    cachedData = data;
    cachedAt = now;

    return NextResponse.json(data, {
      headers: {
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=3600",
        "X-Data-Source": "fresh",
      },
    });
  } catch (error) {
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          "Cache-Control": "public, s-maxage=3600",
          "X-Data-Source": "stale-cache",
        },
      });
    }

    return NextResponse.json(
      {
        error: "Failed to fetch ACLED regional data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 }
    );
  }
}
