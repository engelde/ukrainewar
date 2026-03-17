#!/usr/bin/env node
/**
 * Downloads and processes Kiel Institute Ukraine Support Tracker XLSX
 * into a compact JSON file for the frontend.
 *
 * Output: public/data/kiel-spending.json
 *
 * Run: node scripts/process-kiel.mjs
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, "..", "public", "data", "kiel-spending.json");

const KIEL_XLSX_URL =
  "https://www.kielinstitut.de/fileadmin/Dateiverwaltung/IfW-Publications/fis-import/62a94ad1-2d28-401e-afd0-8a8089b48f2a-Ukraine_Support_Tracker_Release_27.xlsx";

const MONTH_NAMES = [
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

async function main() {
  console.log("Downloading Kiel Institute XLSX...");
  const res = await fetch(KIEL_XLSX_URL);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buf = await res.arrayBuffer();

  console.log("Parsing XLSX...");
  const wb = XLSX.read(buf, { type: "array" });

  // --- Main data ---
  const mainData = XLSX.utils.sheet_to_json(
    wb.Sheets["Bilateral Assistance, MAIN DATA"]
  );

  // --- Country Summary ---
  const summarySheet = XLSX.utils.sheet_to_json(
    wb.Sheets["Country Summary (€)"],
    { header: 1 }
  );
  // Find header row (contains "Country")
  const headerIdx = summarySheet.findIndex(
    (r) => r && r[0] === "Country"
  );
  const summaryHeaders = summarySheet[headerIdx];

  const byCountry = [];
  for (let i = headerIdx + 2; i < summarySheet.length; i++) {
    const row = summarySheet[i];
    if (!row || !row[0] || row[0] === "Total") break;
    byCountry.push({
      country: row[0],
      euMember: row[1] === 1,
      financial: round(row[3]),
      humanitarian: round(row[4]),
      military: round(row[5]),
      total: round(row[6]),
    });
  }
  byCountry.sort((a, b) => b.total - a.total);

  // --- Monthly allocations ---
  const allocSheet = XLSX.utils.sheet_to_json(
    wb.Sheets["Allocations by type and month"],
    { header: 1 }
  );
  const byMonth = [];
  for (const row of allocSheet) {
    if (!row || typeof row[1] !== "number" || row[1] < 40000) continue;
    const date = excelDateToISO(row[1]);
    byMonth.push({
      date,
      military: round(row[2]),
      humanitarian: round(row[3]),
      financial: round(row[4]),
      total: round(row[5]),
    });
  }

  // --- Totals ---
  let totalMilitary = 0,
    totalFinancial = 0,
    totalHumanitarian = 0;
  for (const r of mainData) {
    const val = r.tot_sub_activity_value_EUR || 0;
    const type = (r.aid_type_general || "").trim();
    if (type === "Military") totalMilitary += val;
    else if (type === "Financial") totalFinancial += val;
    else if (type === "Humanitarian") totalHumanitarian += val;
  }

  // --- Top weapons delivered ---
  const weaponCounts = {};
  for (const r of mainData) {
    if (
      (r.aid_type_general || "").trim() !== "Military" ||
      !r.item ||
      !r.item_numb_deliv
    )
      continue;
    const item = r.item_type || r.item || "Other";
    weaponCounts[item] = (weaponCounts[item] || 0) + (r.item_numb_deliv || 0);
  }
  const topWeapons = Object.entries(weaponCounts)
    .map(([name, count]) => ({ name, count: Math.round(count) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // --- Cumulative monthly totals for timeline ---
  const cumulative = [];
  let cumMil = 0,
    cumFin = 0,
    cumHum = 0;
  for (const m of byMonth) {
    cumMil += m.military;
    cumFin += m.financial;
    cumHum += m.humanitarian;
    cumulative.push({
      date: m.date,
      military: round(cumMil),
      financial: round(cumFin),
      humanitarian: round(cumHum),
      total: round(cumMil + cumFin + cumHum),
    });
  }

  const output = {
    lastUpdated: "2025-12-31",
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
    byCountry: byCountry.map((c) => ({
      ...c,
      financial: round(c.financial),
      humanitarian: round(c.humanitarian),
      military: round(c.military),
      total: round(c.total),
    })),
    byMonth,
    cumulative,
    topWeapons,
    source: {
      name: "Kiel Institute Ukraine Support Tracker",
      url: "https://www.kielinstitut.de/topics/war-against-ukraine/ukraine-support-tracker/",
      release: "Release 27 (Dec 2025)",
    },
  };

  writeFileSync(OUTPUT, JSON.stringify(output));
  const sizeKB = (JSON.stringify(output).length / 1024).toFixed(1);
  console.log(`Written ${OUTPUT} (${sizeKB} KB)`);
  console.log(
    `  ${byCountry.length} donors, ${byMonth.length} months, €${output.totals.total}B total`
  );
}

function round(n) {
  return Math.round((n || 0) * 1000) / 1000;
}

function excelDateToISO(serial) {
  const epoch = new Date(1899, 11, 30);
  const date = new Date(epoch.getTime() + serial * 86400000);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
