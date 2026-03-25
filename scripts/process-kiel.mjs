#!/usr/bin/env node

/**
 * Downloads and processes Kiel Institute Ukraine Support Tracker XLSX
 * into a compact JSON file for the frontend.
 *
 * Output: public/data/kiel-spending.json
 *
 * Run: node scripts/process-kiel.mjs
 */

import ExcelJS from "exceljs";
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, "..", "public", "data", "kiel-spending.json");

const KIEL_XLSX_URL =
  "https://www.kielinstitut.de/fileadmin/Dateiverwaltung/IfW-Publications/fis-import/62a94ad1-2d28-401e-afd0-8a8089b48f2a-Ukraine_Support_Tracker_Release_27.xlsx";

const _MONTH_NAMES = [
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

/** Read a named worksheet as array-of-objects (keyed by first row headers). */
function sheetToJson(wb, sheetName) {
  const ws = wb.getWorksheet(sheetName);
  if (!ws) return [];
  const headers = [];
  const rows = [];
  ws.eachRow((row, idx) => {
    const vals = row.values.slice(1);
    if (idx === 1) {
      for (const v of vals) headers.push(v);
      return;
    }
    const obj = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = vals[i] ?? null;
    }
    rows.push(obj);
  });
  return rows;
}

/** Read a named worksheet as array-of-arrays (raw rows). */
function sheetToArrays(wb, sheetName) {
  const ws = wb.getWorksheet(sheetName);
  if (!ws) return [];
  const rows = [];
  ws.eachRow((row) => {
    rows.push(row.values.slice(1));
  });
  return rows;
}

async function main() {
  console.log("Downloading Kiel Institute XLSX...");
  const res = await fetch(KIEL_XLSX_URL);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buf = await res.arrayBuffer();

  console.log("Parsing XLSX...");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(Buffer.from(buf));

  // --- Main data ---
  const mainData = sheetToJson(wb, "Bilateral Assistance, MAIN DATA");

  // --- Country Summary ---
  const summarySheet = sheetToArrays(wb, "Country Summary (€)");
  // Find header row (contains "Country")
  const headerIdx = summarySheet.findIndex((r) => r && r[0] === "Country");
  const _summaryHeaders = summarySheet[headerIdx];

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
  const allocSheet = sheetToArrays(wb, "Allocations by type and month");
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

  // --- Weapon categories (normalized) ---
  const CATEGORY_MAP = {
    "heavy weapon": "Heavy Weapons",
    "ammunition for heavy weapon": "Heavy Weapon Ammo",
    "aviation and drones": "Aviation & Drones",
    "portable defence system": "Portable Defense",
    "ammunition for portable defence system": "Portable Defense Ammo",
    "military equipment": "Military Equipment",
    "light armaments & infantry": "Light Arms & Infantry",
    "ammunition for light infantry": "Small Arms Ammo",
    ammunition: "Ammunition",
    "funding, training, services": "Training & Services",
    missile: "Missiles",
  };
  function normalizeCategory(raw) {
    return CATEGORY_MAP[(raw || "").trim().toLowerCase()] || null;
  }

  const milRows = mainData.filter((r) => (r.aid_type_general || "").trim() === "Military");

  const catBuckets = {};
  for (const r of milRows) {
    const cat = normalizeCategory(r.item_type);
    if (!cat) continue;
    if (!catBuckets[cat]) catBuckets[cat] = { valueEUR: 0, records: 0 };
    catBuckets[cat].valueEUR += Number(r.tot_sub_activity_value_EUR) || 0;
    catBuckets[cat].records++;
  }
  const weaponsByCategory = Object.entries(catBuckets)
    .map(([name, d]) => ({ name, valueEUR: round(d.valueEUR / 1e9), records: d.records }))
    .sort((a, b) => b.valueEUR - a.valueEUR);

  // --- Notable weapon systems (case-normalized grouping) ---
  const hwRows = milRows.filter((r) => {
    const t = (r.item_type || "").trim().toLowerCase();
    return t.includes("heavy weapon") || t.includes("aviation") || t.includes("portable defence");
  });
  const systemBuckets = {};
  const systemDisplayNames = {};
  for (const r of hwRows) {
    const item = (r.item || "").trim();
    if (!item || item === ".") continue;
    const key = item.toLowerCase();
    const val = Number(r.tot_sub_activity_value_EUR) || 0;
    const deliv = Number(r.item_numb_deliv);
    const pledged = Number(r.item_numb);
    const donor = (r.donor || "").trim();
    if (!systemBuckets[key]) {
      systemBuckets[key] = { valueEUR: 0, delivered: 0, pledged: 0, donors: [], nameVotes: {} };
    }
    systemBuckets[key].valueEUR += val;
    // Track which casing appears most often to pick a display name
    systemBuckets[key].nameVotes[item] = (systemBuckets[key].nameVotes[item] || 0) + 1;
    if (!Number.isNaN(deliv) && deliv > 0) systemBuckets[key].delivered += deliv;
    if (!Number.isNaN(pledged) && pledged > 0) systemBuckets[key].pledged += pledged;
    if (!systemBuckets[key].donors.includes(donor)) systemBuckets[key].donors.push(donor);
  }
  const notableWeapons = Object.entries(systemBuckets)
    .filter(([, d]) => d.valueEUR > 500_000_000)
    .map(([, d]) => {
      // Pick the most common casing as display name
      const displayName = Object.entries(d.nameVotes).sort((a, b) => b[1] - a[1])[0][0];
      return {
        name: displayName,
        valueEUR: round(d.valueEUR / 1e9),
        delivered: Math.round(d.delivered),
        pledged: Math.round(d.pledged),
        donors: d.donors.slice(0, 4),
      };
    })
    .sort((a, b) => b.valueEUR - a.valueEUR)
    .slice(0, 20);

  // --- Weapons by donor (top 10 military donors) ---
  const donorWeaponBuckets = {};
  for (const r of milRows) {
    const donor = (r.donor || "").trim();
    const cat = normalizeCategory(r.item_type);
    const val = Number(r.tot_sub_activity_value_EUR) || 0;
    if (!donorWeaponBuckets[donor]) donorWeaponBuckets[donor] = { total: 0, categories: {} };
    donorWeaponBuckets[donor].total += val;
    if (cat)
      donorWeaponBuckets[donor].categories[cat] =
        (donorWeaponBuckets[donor].categories[cat] || 0) + val;
  }
  const weaponsByDonor = Object.entries(donorWeaponBuckets)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10)
    .map(([donor, d]) => ({
      donor,
      totalEUR: round(d.total / 1e9),
      categories: Object.entries(d.categories)
        .map(([name, val]) => ({ name, valueEUR: round(val / 1e9) }))
        .sort((a, b) => b.valueEUR - a.valueEUR)
        .slice(0, 5),
    }));

  // Legacy topWeapons (kept for backward compat)
  const topWeapons = weaponsByCategory
    .slice(0, 15)
    .map((c) => ({ name: c.name, count: c.records }));

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
    weaponsByCategory,
    notableWeapons,
    weaponsByDonor,
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
    `  ${byCountry.length} donors, ${byMonth.length} months, €${output.totals.total}B total`,
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
