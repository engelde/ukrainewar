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
import ExcelJS from "exceljs";
import { discoverLatestRelease } from "../src/lib/kiel-url";
import {
  type SpendingCountry,
  type SpendingCountryCumulative,
  type SpendingData,
  type SpendingMonth,
  type SpendingTotals,
  validateSpendingData,
} from "../src/lib/spending-data";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "public", "data");
const OUTPUT = join(OUTPUT_DIR, "kiel-spending.json");

type RowObject = Record<string, unknown>;
type BucketTotals = Omit<SpendingTotals, "total">;

const CATEGORY_MAP: Record<string, string> = {
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

function round(n: number): number {
  return Math.round((n || 0) * 1000) / 1000;
}

function excelDateToISO(serial: number): string {
  const epoch = new Date(1899, 11, 30);
  const date = new Date(epoch.getTime() + serial * 86400000);
  return dateToMonth(date);
}

function dateToMonth(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function cellStr(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return dateToMonth(value);
  if (Array.isArray(value)) return value.map(cellStr).join("");
  if (!isRecord(value)) return "";

  if (Array.isArray(value.richText)) {
    return value.richText.map((part) => (isRecord(part) ? cellStr(part.text) : "")).join("");
  }
  if (value.result != null) return cellStr(value.result);
  if (value.text != null) return cellStr(value.text);
  if (value.hyperlink != null && value.tooltip != null) return cellStr(value.tooltip);
  return "";
}

function cellNum(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (value instanceof Date) return 0;
  if (typeof value === "string") {
    const cleaned = value.replace(/[€,]/g, "").trim();
    if (!cleaned) return 0;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (isRecord(value) && value.result != null) return cellNum(value.result);
  return 0;
}

function normalizeMonth(value: unknown): string | null {
  if (value instanceof Date) return dateToMonth(value);
  if (typeof value === "number" && value > 40000) return excelDateToISO(value);
  const text = cellStr(value).trim();
  if (!text) return null;
  const iso = text.match(/(\d{4})[-/](\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}`;
  const us = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (us) return `${us[3]}-${us[1].padStart(2, "0")}`;
  return null;
}

function sheetToJson(wb: ExcelJS.Workbook, sheetName: string): RowObject[] {
  const ws = wb.getWorksheet(sheetName);
  if (!ws) return [];
  const headers: string[] = [];
  const rows: RowObject[] = [];
  ws.eachRow((row, idx) => {
    const vals = (row.values as unknown[]).slice(1);
    if (idx === 1) {
      for (const value of vals) headers.push(cellStr(value));
      return;
    }
    const obj: RowObject = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = vals[i] ?? null;
    }
    rows.push(obj);
  });
  return rows;
}

function sheetToArrays(wb: ExcelJS.Workbook, sheetName: string): unknown[][] {
  const ws = wb.getWorksheet(sheetName);
  if (!ws) return [];
  const rows: unknown[][] = [];
  ws.eachRow((row) => {
    rows.push((row.values as unknown[]).slice(1));
  });
  return rows;
}

function findHeaderIndex(row: unknown[], pattern: RegExp, after = -1): number {
  return row.findIndex((value, index) => index > after && pattern.test(cellStr(value)));
}

function parseCountrySummary(wb: ExcelJS.Workbook): SpendingCountry[] {
  const summarySheet = sheetToArrays(wb, "Country Summary (€)");
  const headerIdx = summarySheet.findIndex((row) =>
    row.some((value) => cellStr(value).trim() === "Country"),
  );
  if (headerIdx < 0) return [];

  const headerRow = summarySheet[headerIdx];
  const countryCol = headerRow.findIndex((value) => cellStr(value).trim() === "Country");
  const euMemberCol = findHeaderIndex(headerRow, /eu member/i, countryCol);
  const financialCol = findHeaderIndex(headerRow, /financial/i, countryCol);
  const humanitarianCol = findHeaderIndex(headerRow, /humanitarian/i, countryCol);
  const militaryCol = findHeaderIndex(headerRow, /military/i, countryCol);
  const totalCol = findHeaderIndex(headerRow, /^total/i, countryCol);

  const byCountry: SpendingCountry[] = [];
  for (let i = headerIdx + 2; i < summarySheet.length; i++) {
    const row = summarySheet[i];
    const countryName = cellStr(row[countryCol]).trim();
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
  return byCountry.sort((a, b) => b.total - a.total);
}

function parseAllocationsByMonth(wb: ExcelJS.Workbook): SpendingMonth[] {
  const allocSheet = sheetToArrays(wb, "Allocations by type and month");
  const headerIdx = allocSheet.findIndex((row) =>
    row.some((value) => cellStr(value).trim() === "Month"),
  );
  if (headerIdx < 0) return [];

  const header = allocSheet[headerIdx];
  const monthCol = findHeaderIndex(header, /^month$/i);
  const financialCol = findHeaderIndex(header, /financial/i);
  const humanitarianCol = findHeaderIndex(header, /humanitarian/i);
  const militaryCol = findHeaderIndex(header, /military/i);
  const totalCol = findHeaderIndex(header, /^total/i);

  const byMonth: SpendingMonth[] = [];
  for (let i = headerIdx + 1; i < allocSheet.length; i++) {
    const row = allocSheet[i];
    const date = normalizeMonth(row[monthCol]);
    if (!date) continue;

    const military = round(cellNum(row[militaryCol]));
    const humanitarian = round(cellNum(row[humanitarianCol]));
    const financial = round(cellNum(row[financialCol]));
    const total = round(cellNum(row[totalCol]) || military + humanitarian + financial);
    if (military + humanitarian + financial > 0) {
      byMonth.push({ date, military, humanitarian, financial, total });
    }
  }
  return byMonth.sort((a, b) => a.date.localeCompare(b.date));
}

function addToBucket(bucket: BucketTotals, type: string, value: number) {
  if (type === "Military") bucket.military += value;
  else if (type === "Financial") bucket.financial += value;
  else if (type === "Humanitarian") bucket.humanitarian += value;
}

function totalsFromBucket(bucket: BucketTotals): SpendingTotals {
  return {
    military: round(bucket.military),
    financial: round(bucket.financial),
    humanitarian: round(bucket.humanitarian),
    total: round(bucket.military + bucket.financial + bucket.humanitarian),
  };
}

function aggregateMonthlyFromMainData(mainData: RowObject[]): SpendingMonth[] {
  const monthBuckets: Record<string, BucketTotals> = {};

  for (const row of mainData) {
    const valueBillion = cellNum(row.tot_sub_activity_value_EUR) / 1e9;
    if (valueBillion <= 0) continue;
    const date = normalizeMonth(row.announcement_date);
    if (!date) continue;
    const type = cellStr(row.aid_type_general).trim();
    monthBuckets[date] ??= { military: 0, humanitarian: 0, financial: 0 };
    addToBucket(monthBuckets[date], type, valueBillion);
  }

  return Object.entries(monthBuckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, bucket]) => ({ date, ...totalsFromBucket(bucket) }));
}

function computeTotals(mainData: RowObject[]): SpendingTotals {
  const totals: BucketTotals = { military: 0, humanitarian: 0, financial: 0 };
  for (const row of mainData) {
    const valueEUR = cellNum(row.tot_sub_activity_value_EUR);
    if (valueEUR <= 0) continue;
    addToBucket(totals, cellStr(row.aid_type_general).trim(), valueEUR / 1e9);
  }
  return totalsFromBucket(totals);
}

function computeCumulative(byMonth: SpendingMonth[]): SpendingMonth[] {
  const cumulative: SpendingMonth[] = [];
  const totals: BucketTotals = { military: 0, humanitarian: 0, financial: 0 };
  for (const month of byMonth) {
    totals.military += month.military;
    totals.financial += month.financial;
    totals.humanitarian += month.humanitarian;
    cumulative.push({ date: month.date, ...totalsFromBucket(totals) });
  }
  return cumulative;
}

function computeCountryCumulative(
  mainData: RowObject[],
  months: string[],
  byCountry: SpendingCountry[],
): SpendingCountryCumulative[] {
  const countryMeta = new Map(byCountry.map((country) => [country.country, country.euMember]));
  const monthlyBuckets = new Map<string, Map<string, BucketTotals>>();

  for (const row of mainData) {
    const valueBillion = cellNum(row.tot_sub_activity_value_EUR) / 1e9;
    if (valueBillion <= 0) continue;
    const date = normalizeMonth(row.announcement_date);
    if (!date) continue;
    const donor = cellStr(row.donor).trim();
    if (!donor) continue;
    const type = cellStr(row.aid_type_general).trim();
    if (!monthlyBuckets.has(date)) monthlyBuckets.set(date, new Map());
    const donorBuckets = monthlyBuckets.get(date);
    if (!donorBuckets) continue;
    donorBuckets.set(
      donor,
      donorBuckets.get(donor) ?? { military: 0, humanitarian: 0, financial: 0 },
    );
    addToBucket(donorBuckets.get(donor)!, type, valueBillion);
  }

  const cumulativeByCountry = new Map<string, BucketTotals>();
  const snapshots: SpendingCountryCumulative[] = [];
  for (const month of months) {
    const donorBuckets = monthlyBuckets.get(month);
    if (donorBuckets) {
      for (const [donor, bucket] of donorBuckets.entries()) {
        const current = cumulativeByCountry.get(donor) ?? {
          military: 0,
          humanitarian: 0,
          financial: 0,
        };
        current.military += bucket.military;
        current.financial += bucket.financial;
        current.humanitarian += bucket.humanitarian;
        cumulativeByCountry.set(donor, current);
      }
    }

    const countries = [...cumulativeByCountry.entries()]
      .map(([country, bucket]) => ({
        country,
        euMember: countryMeta.get(country) ?? false,
        ...totalsFromBucket(bucket),
      }))
      .filter((country) => country.total > 0)
      .sort((a, b) => b.total - a.total);

    snapshots.push({ date: month, countries });
  }
  return snapshots;
}

function normalizeCategory(value: unknown): string | null {
  return CATEGORY_MAP[cellStr(value).trim().toLowerCase()] ?? null;
}

function computeWeapons(mainData: RowObject[]) {
  const militaryRows = mainData.filter(
    (row) => cellStr(row.aid_type_general).trim() === "Military",
  );
  const categoryBuckets = new Map<string, { valueEUR: number; records: number }>();

  for (const row of militaryRows) {
    const category = normalizeCategory(row.item_type);
    if (!category) continue;
    const current = categoryBuckets.get(category) ?? { valueEUR: 0, records: 0 };
    current.valueEUR += cellNum(row.tot_sub_activity_value_EUR);
    current.records++;
    categoryBuckets.set(category, current);
  }

  const weaponsByCategory = [...categoryBuckets.entries()]
    .map(([name, data]) => ({
      name,
      valueEUR: round(data.valueEUR / 1e9),
      records: data.records,
    }))
    .sort((a, b) => b.valueEUR - a.valueEUR);

  const systemBuckets = new Map<
    string,
    {
      valueEUR: number;
      delivered: number;
      pledged: number;
      donors: string[];
      nameVotes: Map<string, number>;
    }
  >();

  for (const row of militaryRows) {
    const itemType = cellStr(row.item_type).trim().toLowerCase();
    if (
      !itemType.includes("heavy weapon") &&
      !itemType.includes("aviation") &&
      !itemType.includes("portable defence")
    ) {
      continue;
    }
    const item = cellStr(row.item).trim();
    if (!item || item === ".") continue;
    const key = item.toLowerCase();
    const current = systemBuckets.get(key) ?? {
      valueEUR: 0,
      delivered: 0,
      pledged: 0,
      donors: [],
      nameVotes: new Map<string, number>(),
    };
    current.valueEUR += cellNum(row.tot_sub_activity_value_EUR);
    current.delivered += cellNum(row.item_numb_deliv);
    current.pledged += cellNum(row.item_numb);
    const donor = cellStr(row.donor).trim();
    if (donor && !current.donors.includes(donor)) current.donors.push(donor);
    current.nameVotes.set(item, (current.nameVotes.get(item) ?? 0) + 1);
    systemBuckets.set(key, current);
  }

  const notableWeapons = [...systemBuckets.values()]
    .filter((data) => data.valueEUR > 500_000_000)
    .map((data) => {
      const displayName = [...data.nameVotes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
      return {
        name: displayName,
        valueEUR: round(data.valueEUR / 1e9),
        delivered: Math.round(data.delivered),
        pledged: Math.round(data.pledged),
        donors: data.donors.slice(0, 4),
      };
    })
    .filter((weapon) => weapon.name)
    .sort((a, b) => b.valueEUR - a.valueEUR)
    .slice(0, 20);

  const donorWeaponBuckets = new Map<string, { total: number; categories: Map<string, number> }>();
  for (const row of militaryRows) {
    const donor = cellStr(row.donor).trim();
    if (!donor) continue;
    const category = normalizeCategory(row.item_type);
    const valueEUR = cellNum(row.tot_sub_activity_value_EUR);
    const current = donorWeaponBuckets.get(donor) ?? { total: 0, categories: new Map() };
    current.total += valueEUR;
    if (category)
      current.categories.set(category, (current.categories.get(category) ?? 0) + valueEUR);
    donorWeaponBuckets.set(donor, current);
  }

  const weaponsByDonor = [...donorWeaponBuckets.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10)
    .map(([donor, data]) => ({
      donor,
      totalEUR: round(data.total / 1e9),
      categories: [...data.categories.entries()]
        .map(([name, valueEUR]) => ({ name, valueEUR: round(valueEUR / 1e9) }))
        .sort((a, b) => b.valueEUR - a.valueEUR)
        .slice(0, 5),
    }));

  const topWeapons = weaponsByCategory
    .slice(0, 15)
    .map((category) => ({ name: category.name, count: category.records }));

  return { topWeapons, weaponsByCategory, notableWeapons, weaponsByDonor };
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
  const xlsxBuffer = Buffer.from(buf) as unknown as Parameters<typeof wb.xlsx.load>[0];
  await wb.xlsx.load(xlsxBuffer);

  const mainData = sheetToJson(wb, "Bilateral Assistance, MAIN DATA");
  const byCountry = parseCountrySummary(wb);
  const byMonth = parseAllocationsByMonth(wb);
  const displayMonths = byMonth.length > 0 ? byMonth : aggregateMonthlyFromMainData(mainData);
  const cumulative = computeCumulative(displayMonths);
  const byCountryCumulative = computeCountryCumulative(
    mainData,
    displayMonths.map((month) => month.date),
    byCountry,
  );
  const weapons = computeWeapons(mainData);

  const output: SpendingData = {
    lastUpdated: new Date().toISOString().split("T")[0],
    release,
    currency: "EUR",
    unit: "billions",
    donors: byCountry.length,
    totals: computeTotals(mainData),
    byCountry,
    byMonth: displayMonths,
    cumulative,
    byCountryCumulative,
    ...weapons,
    source: {
      name: "Kiel Institute Ukraine Support Tracker",
      url: "https://www.kielinstitut.de/topics/war-against-ukraine/ukraine-support-tracker/",
      release: `Release ${release}`,
    },
  };

  const validation = validateSpendingData(output);
  if (!validation.valid) {
    throw new Error(`Generated Kiel data failed validation:\n- ${validation.errors.join("\n- ")}`);
  }

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  writeFileSync(OUTPUT, JSON.stringify(output));
  const sizeKB = (JSON.stringify(output).length / 1024).toFixed(1);
  console.log(`Written ${OUTPUT} (${sizeKB} KB)`);
  console.log(
    `  ${byCountry.length} donors, ${displayMonths.length} months, €${output.totals.total}B total`,
  );
}

main().catch((err) => {
  console.error("Error:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
