#!/usr/bin/env npx tsx
/**
 * Downloads and processes Kiel Institute Ukraine Support Tracker XLSX
 * into a compact JSON file for the frontend.
 *
 * Output: public/data/kiel-spending.json
 *
 * Run: npx tsx scripts/prebuild-spending.ts
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";
import { discoverLatestRelease } from "../src/lib/kiel-url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "public", "data");
const OUTPUT = join(OUTPUT_DIR, "kiel-spending.json");

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

async function main() {
  console.log("Discovering latest Kiel Institute release...");
  const { release, url } = await discoverLatestRelease();
  console.log(`Found Release ${release}`);

  console.log("Downloading Kiel Institute XLSX...");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buf = await res.arrayBuffer();

  console.log("Parsing XLSX...");
  const wb = XLSX.read(buf, { type: "array" });

  // Main data
  const mainData = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    wb.Sheets["Bilateral Assistance, MAIN DATA"],
  );

  // Country summary
  const summarySheet = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets["Country Summary (€)"], {
    header: 1,
  });
  const headerIdx = (summarySheet as unknown[][]).findIndex((r) => r && r[0] === "Country");

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
  byCountry.sort((a, b) => (b.total as number) - (a.total as number));

  // Monthly allocations — try dedicated sheet first, fall back to aggregating main data
  const allocSheetName = Object.keys(wb.Sheets).find((s) => s.toLowerCase().includes("allocation"));
  let byMonth: Record<string, unknown>[] = [];
  if (allocSheetName) {
    const allocSheet = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[allocSheetName], {
      header: 1,
    });
    for (const row of allocSheet as unknown[][]) {
      if (!row || !row[1]) continue;

      let date: string | null = null;
      if (typeof row[1] === "number" && row[1] > 40000) {
        date = excelDateToISO(row[1]);
      } else if (typeof row[1] === "string") {
        const m = row[1].match(/(\d{4})-(\d{2})/);
        if (m) date = `${m[1]}-${m[2]}`;
      }
      if (!date) continue;

      const military = typeof row[2] === "number" ? round(row[2]) : 0;
      const humanitarian = typeof row[3] === "number" ? round(row[3]) : 0;
      const financial = typeof row[4] === "number" ? round(row[4]) : 0;
      const total =
        typeof row[5] === "number" ? round(row[5]) : military + humanitarian + financial;

      if (military + humanitarian + financial > 0) {
        byMonth.push({ date, military, humanitarian, financial, total });
      }
    }
  }

  // Fallback: aggregate monthly from main data if sheet wasn't found or produced no results
  if (byMonth.length === 0) {
    const monthBuckets: Record<
      string,
      { military: number; humanitarian: number; financial: number }
    > = {};
    for (const r of mainData) {
      const val = (r.tot_sub_activity_value_EUR as number) || 0;
      if (val <= 0) continue;
      const dateRaw = r.announcement_date as string | number | undefined;
      let ym: string | null = null;
      if (typeof dateRaw === "number" && dateRaw > 40000) {
        ym = excelDateToISO(dateRaw);
      } else if (typeof dateRaw === "string") {
        const m = dateRaw.match(/(\d{4})-(\d{2})/);
        if (m) ym = `${m[1]}-${m[2]}`;
      }
      if (!ym || ym < "2022-02") continue;
      if (!monthBuckets[ym]) monthBuckets[ym] = { military: 0, humanitarian: 0, financial: 0 };
      const type = ((r.aid_type_general as string) || "").trim();
      if (type === "Military") monthBuckets[ym].military += val;
      else if (type === "Financial") monthBuckets[ym].financial += val;
      else if (type === "Humanitarian") monthBuckets[ym].humanitarian += val;
    }
    byMonth = Object.entries(monthBuckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({
        date,
        military: round(d.military),
        humanitarian: round(d.humanitarian),
        financial: round(d.financial),
        total: round(d.military + d.humanitarian + d.financial),
      }));
  }

  // Totals
  let totalMilitary = 0;
  let totalFinancial = 0;
  let totalHumanitarian = 0;
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
    const item = (r.item_type as string) || (r.item as string) || "Other";
    weaponCounts[item] = (weaponCounts[item] || 0) + ((r.item_numb_deliv as number) || 0);
  }
  const topWeapons = Object.entries(weaponCounts)
    .map(([name, count]) => ({ name, count: Math.round(count) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // Cumulative
  const cumulative: Record<string, unknown>[] = [];
  let cumMil = 0;
  let cumFin = 0;
  let cumHum = 0;
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

  const output = {
    lastUpdated: new Date().toISOString().split("T")[0],
    release,
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
      release: `Release ${release}`,
    },
  };

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  writeFileSync(OUTPUT, JSON.stringify(output));
  const sizeKB = (JSON.stringify(output).length / 1024).toFixed(1);
  console.log(`Written ${OUTPUT} (${sizeKB} KB)`);
  console.log(
    `  ${byCountry.length} donors, ${byMonth.length} months, €${output.totals.total}B total`,
  );
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
