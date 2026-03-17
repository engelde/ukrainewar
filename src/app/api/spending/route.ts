import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

const KIEL_XLSX_URL =
  "https://www.kielinstitut.de/fileadmin/Dateiverwaltung/IfW-Publications/fis-import/62a94ad1-2d28-401e-afd0-8a8089b48f2a-Ukraine_Support_Tracker_Release_27.xlsx";

const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

let cachedData: Record<string, unknown> | null = null;
let cachedAt = 0;

function round(n: number): number {
  return Math.round((n || 0) * 1000) / 1000;
}

function excelDateToISO(serial: number): string {
  const epoch = new Date(1899, 11, 30);
  const date = new Date(epoch.getTime() + serial * 86400000);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

async function processKielXLSX(): Promise<Record<string, unknown>> {
  const res = await fetch(KIEL_XLSX_URL);
  if (!res.ok) throw new Error(`Kiel XLSX download failed: ${res.status}`);
  const buf = await res.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });

  // Main data
  const mainData = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    wb.Sheets["Bilateral Assistance, MAIN DATA"]
  );

  // Country summary
  const summarySheet = XLSX.utils.sheet_to_json<unknown[]>(
    wb.Sheets["Country Summary (€)"],
    { header: 1 }
  );
  const headerIdx = (summarySheet as unknown[][]).findIndex(
    (r) => r && r[0] === "Country"
  );

  const byCountry: Record<string, unknown>[] = [];
  for (let i = headerIdx + 2; i < summarySheet.length; i++) {
    const row = summarySheet[i] as unknown[];
    if (!row || !row[0] || row[0] === "Total") break;
    byCountry.push({
      country: row[0],
      euMember: row[1] === 1,
      financial: round(row[3] as number),
      humanitarian: round(row[4] as number),
      military: round(row[5] as number),
      total: round(row[6] as number),
    });
  }
  byCountry.sort(
    (a, b) => (b.total as number) - (a.total as number)
  );

  // Monthly allocations
  const allocSheetName = Object.keys(wb.Sheets).find((s) =>
    s.toLowerCase().includes("allocation")
  );
  const byMonth: Record<string, unknown>[] = [];
  if (allocSheetName) {
    const allocSheet = XLSX.utils.sheet_to_json<unknown[]>(
      wb.Sheets[allocSheetName],
      { header: 1 }
    );
    for (const row of allocSheet as unknown[][]) {
      if (!row || !row[1]) continue;

      let date: string | null = null;
      if (typeof row[1] === "number" && row[1] > 40000) {
        date = excelDateToISO(row[1]);
      } else if (typeof row[1] === "string") {
        // Handle text dates like "2022-02", "Feb 2022", etc.
        const m = row[1].match(/(\d{4})-(\d{2})/);
        if (m) date = `${m[1]}-${m[2]}`;
      }
      if (!date) continue;

      const military = typeof row[2] === "number" ? round(row[2]) : 0;
      const humanitarian = typeof row[3] === "number" ? round(row[3]) : 0;
      const financial = typeof row[4] === "number" ? round(row[4]) : 0;
      const total = typeof row[5] === "number" ? round(row[5]) : military + humanitarian + financial;

      if (military + humanitarian + financial > 0) {
        byMonth.push({ date, military, humanitarian, financial, total });
      }
    }
  }

  // Totals
  let totalMilitary = 0,
    totalFinancial = 0,
    totalHumanitarian = 0;
  for (const r of mainData) {
    const val = (r.tot_sub_activity_value_EUR as number) || 0;
    const type = ((r.aid_type_general as string) || "").trim();
    if (type === "Military") totalMilitary += val;
    else if (type === "Financial") totalFinancial += val;
    else if (type === "Humanitarian") totalHumanitarian += val;
  }

  // Top weapons
  const weaponCounts: Record<string, number> = {};
  for (const r of mainData) {
    if (
      ((r.aid_type_general as string) || "").trim() !== "Military" ||
      !r.item ||
      !r.item_numb_deliv
    )
      continue;
    const item = ((r.item_type as string) || (r.item as string) || "Other");
    weaponCounts[item] =
      (weaponCounts[item] || 0) + ((r.item_numb_deliv as number) || 0);
  }
  const topWeapons = Object.entries(weaponCounts)
    .map(([name, count]) => ({ name, count: Math.round(count) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // Cumulative
  const cumulative: Record<string, unknown>[] = [];
  let cumMil = 0,
    cumFin = 0,
    cumHum = 0;
  for (const m of byMonth) {
    cumMil += m.military as number;
    cumFin += m.financial as number;
    cumHum += m.humanitarian as number;
    cumulative.push({
      date: m.date,
      military: round(cumMil),
      financial: round(cumFin),
      humanitarian: round(cumHum),
      total: round(cumMil + cumFin + cumHum),
    });
  }

  return {
    lastUpdated: new Date().toISOString().split("T")[0],
    release: 27,
    currency: "EUR",
    unit: "billions",
    donors: byCountry.length,
    totals: {
      military: round(totalMilitary / 1e9),
      financial: round(totalFinancial / 1e9),
      humanitarian: round(totalHumanitarian / 1e9),
      total: round((totalMilitary + totalFinancial + totalHumanitarian) / 1e9),
    },
    byCountry,
    byMonth,
    cumulative,
    topWeapons,
    source: {
      name: "Kiel Institute Ukraine Support Tracker",
      url: "https://www.kielinstitut.de/topics/war-against-ukraine/ukraine-support-tracker/",
      release: "Release 27 (Dec 2025)",
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
            "public, s-maxage=604800, stale-while-revalidate=86400",
          "X-Data-Source": "cache",
        },
      });
    }

    const data = await processKielXLSX();
    cachedData = data;
    cachedAt = now;

    return NextResponse.json(data, {
      headers: {
        "Cache-Control":
          "public, s-maxage=604800, stale-while-revalidate=86400",
        "X-Data-Source": "fresh",
      },
    });
  } catch (error) {
    // Fall back to cached data even if stale
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
        error: "Failed to fetch spending data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 }
    );
  }
}
