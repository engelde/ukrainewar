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

const KIEL_PAGE_URL = "https://www.ifw-kiel.de/topics/war-against-ukraine/ukraine-support-tracker/";

// Fallback if page scraping fails — update when a new release is confirmed
const FALLBACK_URL =
  "https://www.kielinstitut.de/fileadmin/Dateiverwaltung/IfW-Publications/fis-import/c80bbebb-b4e7-4581-8f32-e32a1da7ecfa-Ukraine_Support_Tracker_Release_28.xlsx";
const FALLBACK_RELEASE = 28;

async function discoverLatestRelease() {
  try {
    const res = await fetch(KIEL_PAGE_URL);
    if (res.ok) {
      const html = await res.text();
      const match = html.match(
        /(fileadmin\/Dateiverwaltung\/IfW-Publications\/fis-import\/[^"]*-Ukraine_Support_Tracker_Release_(\d+)\.xlsx)/,
      );
      if (match) {
        return {
          release: parseInt(match[2], 10),
          url: `https://www.kielinstitut.de/${match[1]}`,
        };
      }
    }
  } catch {
    // fall through to fallback
  }
  return { release: FALLBACK_RELEASE, url: FALLBACK_URL };
}

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

/**
 * Extracts a plain string from an ExcelJS cell value.
 * Cells can be plain strings, numbers, rich-text objects ({richText: [...]}),
 * or formula-result objects ({formula: "...", result: value}).
 */
function cellStr(val) {
  if (val == null) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (val.richText && Array.isArray(val.richText)) {
    return val.richText.map((r) => r.text || "").join("");
  }
  if (val.result != null) return cellStr(val.result);
  return String(val);
}

/**
 * Extracts a plain number from an ExcelJS cell value.
 * Handles plain numbers and formula-result objects ({formula: "...", result: number}).
 */
function cellNum(val) {
  if (val == null) return 0;
  if (typeof val === "number") return val;
  if (val.result != null) return cellNum(val.result);
  return 0;
}

/** Read a named worksheet as array-of-objects (keyed by first row headers). */
function sheetToJson(wb, sheetName) {
  const ws = wb.getWorksheet(sheetName);
  if (!ws) return [];
  const headers = [];
  const rows = [];
  ws.eachRow((row, idx) => {
    const vals = row.values.slice(1);
    if (idx === 1) {
      for (const v of vals) headers.push(cellStr(v));
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
  console.log("Discovering latest Kiel Institute release...");
  const { release, url } = await discoverLatestRelease();
  console.log(`Found Release ${release}: ${url}`);

  console.log("Downloading Kiel Institute XLSX...");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buf = await res.arrayBuffer();

  console.log("Parsing XLSX...");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(Buffer.from(buf));

  // --- Main data ---
  const mainData = sheetToJson(wb, "Bilateral Assistance, MAIN DATA");

  // --- Country Summary ---
  const summarySheet = sheetToArrays(wb, "Country Summary (€)");
  // Find header row: "Country" may be in col[0] (old) or col[1] (Release 28+, added blank col A)
  const headerIdx = summarySheet.findIndex(
    (r) => r && (cellStr(r[0]) === "Country" || cellStr(r[1]) === "Country"),
  );
  const headerRow = summarySheet[headerIdx] ?? [];
  // Detect which column holds "Country" to derive all other column offsets
  const countryCol = cellStr(headerRow[0]) === "Country" ? 0 : 1;
  const euMemberCol = countryCol + 1;
  // Skip any inserted columns between EU member and Financial by scanning header
  const financialCol = headerRow.findIndex(
    (v, i) => i > euMemberCol && /financial/i.test(cellStr(v)),
  );
  const humanitarianCol = financialCol >= 0 ? financialCol + 1 : countryCol + 4;
  const militaryCol = financialCol >= 0 ? financialCol + 2 : countryCol + 5;
  const totalCol = financialCol >= 0 ? financialCol + 3 : countryCol + 6;

  const byCountry = [];
  for (let i = headerIdx + 2; i < summarySheet.length; i++) {
    const row = summarySheet[i];
    const countryName = row && cellStr(row[countryCol]);
    if (!countryName || countryName === "Total") break;
    byCountry.push({
      country: countryName,
      euMember: cellNum(row[euMemberCol]) === 1,
      financial: round(cellNum(row[financialCol])),
      humanitarian: round(cellNum(row[humanitarianCol])),
      military: round(cellNum(row[militaryCol])),
      total: round(cellNum(row[totalCol])),
    });
  }
  byCountry.sort((a, b) => b.total - a.total);

  // --- Monthly allocations ---
  const allocSheet = sheetToArrays(wb, "Allocations by type and month");
  // Find header row: look for "Month" in any column
  const allocHeaderIdx = allocSheet.findIndex((r) => r?.some((v) => cellStr(v).trim() === "Month"));
  const allocHeader = allocSheet[allocHeaderIdx] ?? [];
  // Detect column indices from header (robust against future reordering)
  const allocMonthCol = allocHeader.findIndex((v) => cellStr(v).trim() === "Month");
  const allocFinCol = allocHeader.findIndex((v) => /financial/i.test(cellStr(v)));
  const allocHumCol = allocHeader.findIndex((v) => /humanitarian/i.test(cellStr(v)));
  const allocMilCol = allocHeader.findIndex((v) => /military/i.test(cellStr(v)));
  const allocTotalCol = allocHeader.findIndex((v) => /^total/i.test(cellStr(v).trim()));

  const byMonth = [];
  for (let i = allocHeaderIdx + 1; i < allocSheet.length; i++) {
    const row = allocSheet[i];
    if (!row) continue;
    const rawDate = row[allocMonthCol >= 0 ? allocMonthCol : 1];
    let date;
    if (rawDate instanceof Date) {
      const y = rawDate.getFullYear();
      const m = String(rawDate.getMonth() + 1).padStart(2, "0");
      date = `${y}-${m}`;
    } else if (typeof rawDate === "number" && rawDate > 40000) {
      date = excelDateToISO(rawDate);
    } else {
      continue;
    }
    const financial = cellNum(row[allocFinCol >= 0 ? allocFinCol : 4]);
    const humanitarian = cellNum(row[allocHumCol >= 0 ? allocHumCol : 3]);
    const military = cellNum(row[allocMilCol >= 0 ? allocMilCol : 2]);
    const total = cellNum(row[allocTotalCol >= 0 ? allocTotalCol : 5]);
    byMonth.push({
      date,
      military: round(military),
      humanitarian: round(humanitarian),
      financial: round(financial),
      total: round(total),
    });
  }

  // --- Totals ---
  let totalMilitary = 0,
    totalFinancial = 0,
    totalHumanitarian = 0;
  for (const r of mainData) {
    const val = cellNum(r.tot_sub_activity_value_EUR);
    const type = cellStr(r.aid_type_general).trim();
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
    return CATEGORY_MAP[cellStr(raw).trim().toLowerCase()] || null;
  }

  const milRows = mainData.filter((r) => cellStr(r.aid_type_general).trim() === "Military");

  const catBuckets = {};
  for (const r of milRows) {
    const cat = normalizeCategory(r.item_type);
    if (!cat) continue;
    if (!catBuckets[cat]) catBuckets[cat] = { valueEUR: 0, records: 0 };
    catBuckets[cat].valueEUR += cellNum(r.tot_sub_activity_value_EUR);
    catBuckets[cat].records++;
  }
  const weaponsByCategory = Object.entries(catBuckets)
    .map(([name, d]) => ({ name, valueEUR: round(d.valueEUR / 1e9), records: d.records }))
    .sort((a, b) => b.valueEUR - a.valueEUR);

  // --- Notable weapon systems (case-normalized grouping) ---
  const hwRows = milRows.filter((r) => {
    const t = cellStr(r.item_type).trim().toLowerCase();
    return t.includes("heavy weapon") || t.includes("aviation") || t.includes("portable defence");
  });
  const systemBuckets = {};
  const _systemDisplayNames = {};
  for (const r of hwRows) {
    const item = cellStr(r.item).trim();
    if (!item || item === ".") continue;
    const key = item.toLowerCase();
    const val = cellNum(r.tot_sub_activity_value_EUR);
    const deliv = cellNum(r.item_numb_deliv);
    const pledged = cellNum(r.item_numb);
    const donor = cellStr(r.donor).trim();
    if (!systemBuckets[key]) {
      systemBuckets[key] = { valueEUR: 0, delivered: 0, pledged: 0, donors: [], nameVotes: {} };
    }
    systemBuckets[key].valueEUR += val;
    // Track which casing appears most often to pick a display name
    systemBuckets[key].nameVotes[item] = (systemBuckets[key].nameVotes[item] || 0) + 1;
    if (deliv > 0) systemBuckets[key].delivered += deliv;
    if (pledged > 0) systemBuckets[key].pledged += pledged;
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
    const donor = cellStr(r.donor).trim();
    const cat = normalizeCategory(r.item_type);
    const val = cellNum(r.tot_sub_activity_value_EUR);
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
      release: `Release ${release}`,
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
