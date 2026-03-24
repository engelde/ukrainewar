import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { cacheGet, cacheSet, isFresh, isUsableStale } from "@/lib/cache";
import { discoverLatestRelease } from "@/lib/kiel-url";

const PREBUILD_PATH = join(process.cwd(), "public", "data", "kiel-spending.json");

const CACHE_KEY = "spending-kiel";
const TTL = 604800; // 7 days in seconds
const MEM_TTL = TTL * 1000; // 7 days in ms

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
  const { release, url } = await discoverLatestRelease();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Kiel XLSX download failed: ${res.status}`);
  const buf = await res.arrayBuffer();
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

  // Top weapons (legacy field)
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

  // Normalized weapon categories
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
  function normalizeCategory(raw: string): string | null {
    return CATEGORY_MAP[(raw || "").trim().toLowerCase()] || null;
  }

  const milRows = mainData.filter(
    (r) => ((r.aid_type_general as string) || "").trim() === "Military",
  );

  const catBuckets: Record<string, { valueEUR: number; records: number }> = {};
  for (const r of milRows) {
    const cat = normalizeCategory(r.item_type as string);
    if (!cat) continue;
    if (!catBuckets[cat]) catBuckets[cat] = { valueEUR: 0, records: 0 };
    catBuckets[cat].valueEUR += Number(r.tot_sub_activity_value_EUR) || 0;
    catBuckets[cat].records++;
  }
  const weaponsByCategory = Object.entries(catBuckets)
    .map(([name, d]) => ({ name, valueEUR: round(d.valueEUR / 1e9), records: d.records }))
    .sort((a, b) => b.valueEUR - a.valueEUR);

  const hwRows = milRows.filter((r) => {
    const t = ((r.item_type as string) || "").trim().toLowerCase();
    return t.includes("heavy weapon") || t.includes("aviation") || t.includes("portable defence");
  });
  const systemBuckets: Record<
    string,
    {
      valueEUR: number;
      delivered: number;
      pledged: number;
      donors: string[];
      nameVotes: Record<string, number>;
    }
  > = {};
  for (const r of hwRows) {
    const item = ((r.item as string) || "").trim();
    if (!item || item === ".") continue;
    const key = item.toLowerCase();
    const val = Number(r.tot_sub_activity_value_EUR) || 0;
    const deliv = Number(r.item_numb_deliv);
    const pledged = Number(r.item_numb);
    const donor = ((r.donor as string) || "").trim();
    if (!systemBuckets[key])
      systemBuckets[key] = { valueEUR: 0, delivered: 0, pledged: 0, donors: [], nameVotes: {} };
    systemBuckets[key].valueEUR += val;
    systemBuckets[key].nameVotes[item] = (systemBuckets[key].nameVotes[item] || 0) + 1;
    if (!Number.isNaN(deliv) && deliv > 0) systemBuckets[key].delivered += deliv;
    if (!Number.isNaN(pledged) && pledged > 0) systemBuckets[key].pledged += pledged;
    if (!systemBuckets[key].donors.includes(donor)) systemBuckets[key].donors.push(donor);
  }
  const notableWeapons = Object.entries(systemBuckets)
    .filter(([, d]) => d.valueEUR > 500_000_000)
    .map(([, d]) => {
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

  const donorWeaponBuckets: Record<string, { total: number; categories: Record<string, number> }> =
    {};
  for (const r of milRows) {
    const donor = ((r.donor as string) || "").trim();
    const cat = normalizeCategory(r.item_type as string);
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
    weaponsByCategory,
    notableWeapons,
    weaponsByDonor,
    source: {
      name: "Kiel Institute Ukraine Support Tracker",
      url: "https://www.kielinstitut.de/topics/war-against-ukraine/ukraine-support-tracker/",
      release: `Release ${release}`,
    },
  };
}

function loadPrebuildData(): Record<string, unknown> | null {
  try {
    if (!existsSync(PREBUILD_PATH)) return null;
    const raw = readFileSync(PREBUILD_PATH, "utf-8");
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// Dedup concurrent fetches
let inflightPromise: Promise<Record<string, unknown>> | null = null;

async function fetchAndCache(): Promise<Record<string, unknown>> {
  if (inflightPromise) return inflightPromise;
  inflightPromise = (async () => {
    const data = await processKielXLSX();
    cachedData = data;
    cachedAt = Date.now();
    await cacheSet(CACHE_KEY, data, TTL);
    return data;
  })();
  try {
    return await inflightPromise;
  } finally {
    inflightPromise = null;
  }
}

function refreshInBackground() {
  if (inflightPromise) return;
  fetchAndCache().catch((err) => {
    console.error("[spending] Background refresh failed:", err);
  });
}

export async function GET() {
  try {
    // Fast in-memory layer
    const now = Date.now();
    if (cachedData && now - cachedAt < MEM_TTL) {
      return NextResponse.json(cachedData, {
        headers: {
          "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
          "X-Cache": "HIT",
          "X-Data-Source": "cache",
        },
      });
    }

    // Persistent cache layer
    const cached = await cacheGet<Record<string, unknown>>(CACHE_KEY);

    if (cached && isFresh(cached)) {
      cachedData = cached.data;
      cachedAt = cached.timestamp;
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
          "X-Cache": "HIT",
          "X-Data-Source": "cache",
        },
      });
    }

    if (cached && isUsableStale(cached)) {
      refreshInBackground();
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=604800",
          "X-Cache": "STALE",
          "X-Data-Source": "stale-cache",
        },
      });
    }

    // Try pre-processed JSON before expensive XLSX download
    const prebuild = loadPrebuildData();
    if (prebuild) {
      cachedData = prebuild;
      cachedAt = Date.now();
      await cacheSet(CACHE_KEY, prebuild, TTL);
      return NextResponse.json(prebuild, {
        headers: {
          "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
          "X-Cache": "MISS",
          "X-Data-Source": "prebuild",
        },
      });
    }

    // Cold start fallback — download and parse XLSX
    const data = await fetchAndCache();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
        "X-Cache": "MISS",
        "X-Data-Source": "fresh",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch spending data";
    console.error("Kiel spending error:", message);

    // Serve any stale persistent data on error
    const stale = await cacheGet<Record<string, unknown>>(CACHE_KEY);
    if (stale) {
      return NextResponse.json(stale.data, {
        headers: {
          "Cache-Control": "public, s-maxage=3600",
          "X-Cache": "ERROR-STALE",
          "X-Data-Source": "stale-cache",
          "X-Error": message,
        },
      });
    }

    // Fall back to in-memory cached data even if stale
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          "Cache-Control": "public, s-maxage=3600",
          "X-Cache": "ERROR-STALE",
          "X-Data-Source": "stale-cache",
          "X-Error": message,
        },
      });
    }

    return NextResponse.json(
      {
        error: "Failed to fetch spending data",
        details: message,
      },
      { status: 502 },
    );
  }
}
