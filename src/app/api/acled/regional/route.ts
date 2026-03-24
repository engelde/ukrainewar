import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { cacheGet, cacheSet, isFresh, isUsableStale } from "@/lib/cache";

const CACHE_KEY = "acled-regional";
const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours

const HDX_DATASET_ID = "ukraine-acled-conflict-data";
const HDX_API = "https://data.humdata.org/api/3/action/package_show";

// Resource IDs are stable even when filenames change
const RESOURCE_IDS = {
  politicalViolence: "e122ca1c-9463-4e3a-8731-8a85fab2a15e",
  civilianTargeting: "23755ad0-1d81-4b10-9e66-23b784ccd429",
  demonstrations: "0f040d73-471e-4535-bef1-59ac09faa63c",
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

// Dedup concurrent requests
let inflightPromise: Promise<Record<string, unknown>> | null = null;

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
  months: Record<string, { events: number; fatalities: number; civilian: number; demos: number }>;
}

async function resolveResourceUrls(): Promise<Record<string, string>> {
  const res = await fetch(`${HDX_API}?id=${HDX_DATASET_ID}`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HDX API failed: ${res.status}`);
  const json = await res.json();
  const resources = json.result?.resources || [];

  const urls: Record<string, string> = {};
  for (const r of resources) {
    if (r.id === RESOURCE_IDS.politicalViolence) urls.politicalViolence = r.url;
    else if (r.id === RESOURCE_IDS.civilianTargeting) urls.civilianTargeting = r.url;
    else if (r.id === RESOURCE_IDS.demonstrations) urls.demonstrations = r.url;
  }

  if (!urls.politicalViolence || !urls.civilianTargeting || !urls.demonstrations) {
    throw new Error("HDX dataset missing expected resources");
  }

  return urls;
}

async function downloadXLSX(url: string): Promise<AcledRow[]> {
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`HDX download failed: ${res.status}`);
  const buf = await res.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  return XLSX.utils.sheet_to_json<AcledRow>(wb.Sheets.Data);
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
  >,
) {
  for (const row of rows) {
    const oblast = row.Admin1;
    const month = MONTH_TO_NUM[row.Month || ""];
    const year = String(row.Year);
    if (!oblast || !month || !year) continue;

    const key = `${year}-${month}`;
    const events = row.Events || 0;
    const fatalities = row.Fatalities || 0;

    if (!oblasts[oblast]) oblasts[oblast] = { pcode: row["Admin1 Pcode"] || "", months: {} };
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
  const urls = await resolveResourceUrls();
  const [pvData, ctData, demoData] = await Promise.all([
    downloadXLSX(urls.politicalViolence),
    downloadXLSX(urls.civilianTargeting),
    downloadXLSX(urls.demonstrations),
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
            const monthNames = [
              "",
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ];
            return {
              month: monthNames[parseInt(m, 10)] || date,
              year: parseInt(y, 10),
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
      ]),
    ),
    timeline,
    yearlyTotals: Object.entries(yearlyTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, data]) => ({ year, ...data })),
    cumulativeFatalities,
    source: {
      name: "ACLED via HDX",
      url: "https://data.humdata.org/dataset/ukraine-acled-conflict-data",
      attribution: "ACLED (Armed Conflict Location & Event Data Project). Licensed under CC-BY.",
    },
  };
}

export async function GET() {
  try {
    const cached = await cacheGet<Record<string, unknown>>(CACHE_KEY);

    if (cached && isFresh(cached)) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
          "X-Data-Source": "cache",
        },
      });
    }

    if (cached && isUsableStale(cached)) {
      // Refresh in background, serve stale immediately
      if (!inflightPromise) {
        inflightPromise = processAcledData()
          .then(async (data) => {
            await cacheSet(CACHE_KEY, data, CACHE_TTL_SECONDS);
            return data;
          })
          .catch((err) => {
            console.error("[acled/regional] Background refresh failed:", err);
            return cached.data;
          })
          .finally(() => {
            inflightPromise = null;
          });
      }

      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
          "X-Data-Source": "stale",
        },
      });
    }

    // Cold start — fetch and cache
    let data: Record<string, unknown>;
    if (inflightPromise) {
      data = await inflightPromise;
    } else {
      inflightPromise = processAcledData();
      try {
        data = await inflightPromise;
      } finally {
        inflightPromise = null;
      }
    }

    await cacheSet(CACHE_KEY, data, CACHE_TTL_SECONDS);

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
        "X-Data-Source": "fresh",
      },
    });
  } catch (error) {
    const stale = await cacheGet<Record<string, unknown>>(CACHE_KEY);
    if (stale) {
      return NextResponse.json(stale.data, {
        headers: {
          "Cache-Control": "public, s-maxage=3600",
          "X-Data-Source": "error-stale",
        },
      });
    }

    return NextResponse.json(
      {
        error: "Failed to fetch ACLED regional data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 },
    );
  }
}
