import { NextResponse } from "next/server";
import { cacheGet, cacheSet, isFresh, isUsableStale } from "@/lib/cache";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Ukraine Energy Infrastructure API
 *
 * Fetches electricity generation data from the ENTSO-E Transparency Platform.
 * If ENTSO-E lacks Ukraine data (UA joined as observer; coverage is limited),
 * falls back to a curated static dataset reflecting wartime damage assessments.
 *
 * ENTSO-E API docs:
 *   https://transparency.entsoe.eu/content/static_content/Static%20content/web%20api/Guide.html
 *
 * Ukraine Area EIC: 10Y1001C--00003F (UA-BEI)
 * Document type A75 — Actual Generation Per Type
 * Process type  A16 — Realised
 *
 * Returns a summary of Ukraine's energy mix, damaged capacity, and plant-level
 * status including the occupied Zaporizhzhia NPP.
 */

const CACHE_KEY = "energy:ukraine";
const CACHE_TTL = 6 * 60 * 60; // 6 hours

// ---------------------------------------------------------------------------
// ENTSO-E configuration
// ---------------------------------------------------------------------------

const ENTSOE_BASE = "https://web-api.tp.entsoe.eu/api";
const ENTSOE_TOKEN = process.env.ENTSOE_TOKEN ?? "";
const UA_EIC = "10Y1001C--00003F";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EnergyPlant {
  name: string;
  type: "nuclear" | "thermal" | "hydro" | "solar" | "wind" | "other";
  /** Nameplate capacity in GW */
  capacity: number;
  status: "operational" | "damaged" | "destroyed" | "occupied" | "reduced";
  operational: boolean;
}

interface EnergyData {
  /** Pre-war installed capacity in GW */
  totalCapacity: number;
  /** Current estimated generation in GW, or null if unavailable */
  currentGeneration: number | null;
  /** Nuclear share of actual generation (0-100) */
  nuclearShare: number;
  /** Renewable share of actual generation (0-100) */
  renewableShare: number;
  /** System stress level derived from capacity vs demand */
  status: "normal" | "stressed" | "critical";
  plants: EnergyPlant[];
  /** Total capacity offline due to war damage or occupation in GW */
  damagedCapacity: number;
  source: "ENTSO-E" | "curated";
  lastUpdated: string;
}

// ---------------------------------------------------------------------------
// ENTSO-E fetching
// ---------------------------------------------------------------------------

/**
 * Build the ENTSO-E query URL for Actual Generation Per Type (A75).
 * Requests the last 7 days of data for the Ukraine bidding zone.
 */
function buildEntsoeUrl(): string {
  const now = new Date();
  const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // ENTSO-E requires UTC timestamps in yyyyMMddHHmm format
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}${String(d.getUTCHours()).padStart(2, "0")}${String(d.getUTCMinutes()).padStart(2, "0")}`;

  const params = new URLSearchParams({
    securityToken: ENTSOE_TOKEN,
    documentType: "A75",
    processType: "A16",
    in_Domain: UA_EIC,
    periodStart: fmt(start),
    periodEnd: fmt(now),
  });

  return `${ENTSOE_BASE}?${params.toString()}`;
}

/**
 * Parse ENTSO-E XML response into generation values by PSR type.
 * Returns a map of ENTSO-E PSR type codes → total MWh, or null on failure.
 *
 * PSR type reference (B-codes):
 *   B01 Biomass, B04 Fossil Gas, B05 Fossil Hard Coal, B06 Fossil Lignite,
 *   B09 Geothermal, B10 Hydro Pumped Storage, B11 Hydro Run-of-river,
 *   B12 Hydro Reservoir, B14 Nuclear, B15 Other renewable,
 *   B16 Solar, B18 Wind Offshore, B19 Wind Onshore
 */
function parseEntsoeXml(xml: string): Map<string, number> | null {
  const result = new Map<string, number>();

  const seriesBlocks = xml.match(/<TimeSeries>[\s\S]*?<\/TimeSeries>/g);
  if (!seriesBlocks || seriesBlocks.length === 0) return null;

  for (const block of seriesBlocks) {
    const psrMatch = block.match(/<psrType>(B\d+)<\/psrType>/);
    if (!psrMatch) continue;
    const psrType = psrMatch[1];

    const quantities = block.match(/<quantity>([\d.]+)<\/quantity>/g);
    if (!quantities) continue;

    let total = 0;
    for (const q of quantities) {
      const val = q.match(/<quantity>([\d.]+)<\/quantity>/);
      if (val) total += Number.parseFloat(val[1]);
    }

    const existing = result.get(psrType) ?? 0;
    result.set(psrType, existing + total);
  }

  return result.size > 0 ? result : null;
}

/** Map ENTSO-E PSR type codes to fuel categories. */
const PSR_CATEGORIES: Record<string, EnergyPlant["type"]> = {
  B01: "other", // Biomass
  B04: "thermal", // Fossil Gas
  B05: "thermal", // Fossil Hard Coal
  B06: "thermal", // Fossil Lignite
  B09: "other", // Geothermal
  B10: "hydro", // Hydro Pumped Storage
  B11: "hydro", // Hydro Run-of-river
  B12: "hydro", // Hydro Reservoir
  B14: "nuclear",
  B15: "other", // Other renewable
  B16: "solar",
  B18: "wind", // Wind Offshore
  B19: "wind", // Wind Onshore
};

/**
 * Convert ENTSO-E generation data into our response format.
 * Merges live generation shares with the curated plant list.
 */
function entsoeToEnergyData(generationByType: Map<string, number>): EnergyData {
  let totalGen = 0;
  let nuclearGen = 0;
  let renewableGen = 0;

  for (const [psr, mwh] of generationByType) {
    totalGen += mwh;
    const cat = PSR_CATEGORIES[psr] ?? "other";
    if (cat === "nuclear") nuclearGen += mwh;
    if (cat === "solar" || cat === "wind" || cat === "hydro") renewableGen += mwh;
  }

  const nuclearShare = totalGen > 0 ? Math.round((nuclearGen / totalGen) * 100) : 0;
  const renewableShare = totalGen > 0 ? Math.round((renewableGen / totalGen) * 100) : 0;

  // Average generation over 7 days of hourly data (168 hours), converted MW → GW
  const currentGenerationGW = totalGen > 0 ? Math.round((totalGen / 168 / 1000) * 100) / 100 : null;

  const plants = getCuratedPlants();
  const damagedCapacity = plants
    .filter((p) => !p.operational)
    .reduce((sum, p) => sum + p.capacity, 0);

  let status: EnergyData["status"] = "normal";
  if (currentGenerationGW !== null) {
    const utilizationRatio = currentGenerationGW / 55;
    if (utilizationRatio < 0.3) status = "critical";
    else if (utilizationRatio < 0.5) status = "stressed";
  }

  return {
    totalCapacity: 55,
    currentGeneration: currentGenerationGW,
    nuclearShare,
    renewableShare,
    status,
    plants,
    damagedCapacity: Math.round(damagedCapacity * 10) / 10,
    source: "ENTSO-E",
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Fetch generation data from the ENTSO-E Transparency Platform.
 * Returns structured energy data or null if Ukraine data is unavailable.
 */
async function fetchFromEntsoe(): Promise<EnergyData | null> {
  if (!ENTSOE_TOKEN) return null;

  const url = buildEntsoeUrl();
  const res = await fetch(url, {
    headers: { Accept: "application/xml" },
    signal: AbortSignal.timeout(15_000),
  });

  // ENTSO-E returns 400 with "No matching data found" when data is unavailable
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.warn(`[energy] ENTSO-E responded ${res.status}: ${body.slice(0, 200)}`);
    return null;
  }

  const xml = await res.text();
  const generationByType = parseEntsoeXml(xml);
  if (!generationByType) {
    console.warn("[energy] ENTSO-E returned XML but no generation data found");
    return null;
  }

  return entsoeToEnergyData(generationByType);
}

// ---------------------------------------------------------------------------
// Curated static fallback
// ---------------------------------------------------------------------------

/**
 * Major power plants and generation assets in Ukraine with wartime status.
 *
 * Sources:
 * - IAEA updates on Zaporizhzhia NPP
 * - Ukrenergo (UA grid operator) public reports
 * - IEA Ukraine Energy Profile
 * - Media reporting on Russian strikes against energy infrastructure (2022–2025)
 *
 * Pre-war installed capacity breakdown (~55 GW):
 *   Nuclear   ~13.8 GW  (4 operational NPPs + occupied Zaporizhzhia)
 *   Thermal   ~28.0 GW  (coal + gas; ~50% destroyed/heavily damaged)
 *   Hydro      ~6.3 GW  (Kakhovka destroyed, Dnipro HPP damaged)
 *   Solar      ~5.5 GW  (partially in occupied/frontline areas)
 *   Wind       ~1.7 GW  (partially in occupied/frontline areas)
 *   Other      ~0.5 GW  (biomass, CHP)
 */
function getCuratedPlants(): EnergyPlant[] {
  return [
    // --- Nuclear ---
    {
      name: "Zaporizhzhia NPP",
      type: "nuclear",
      capacity: 6.0,
      status: "occupied",
      operational: false,
    },
    {
      name: "South Ukraine NPP",
      type: "nuclear",
      capacity: 3.0,
      status: "operational",
      operational: true,
    },
    {
      name: "Rivne NPP",
      type: "nuclear",
      capacity: 2.835,
      status: "operational",
      operational: true,
    },
    {
      name: "Khmelnytskyi NPP",
      type: "nuclear",
      capacity: 2.0,
      status: "operational",
      operational: true,
    },

    // --- Thermal (heavily targeted by Russian strikes) ---
    {
      name: "Trypilska TPS",
      type: "thermal",
      capacity: 1.8,
      status: "destroyed",
      operational: false,
    },
    {
      name: "Zmiyivska TPS",
      type: "thermal",
      capacity: 2.175,
      status: "destroyed",
      operational: false,
    },
    {
      name: "Burshtyn TPS",
      type: "thermal",
      capacity: 2.4,
      status: "damaged",
      operational: false,
    },
    {
      name: "Ladyzhyn TPS",
      type: "thermal",
      capacity: 1.8,
      status: "damaged",
      operational: false,
    },
    {
      name: "Kurakhove TPS",
      type: "thermal",
      capacity: 1.46,
      status: "destroyed",
      operational: false,
    },
    {
      name: "Vuhlehirska TPS",
      type: "thermal",
      capacity: 3.6,
      status: "damaged",
      operational: false,
    },
    {
      name: "Kryvorizka TPS",
      type: "thermal",
      capacity: 2.82,
      status: "damaged",
      operational: false,
    },
    {
      name: "Zaporizka TPS",
      type: "thermal",
      capacity: 3.6,
      status: "damaged",
      operational: false,
    },
    {
      name: "Other thermal (operational)",
      type: "thermal",
      capacity: 8.345,
      status: "reduced",
      operational: true,
    },

    // --- Hydro ---
    {
      name: "Kakhovka HPP",
      type: "hydro",
      capacity: 0.357,
      status: "destroyed",
      operational: false,
    },
    {
      name: "Dnipro HPP",
      type: "hydro",
      capacity: 1.569,
      status: "damaged",
      operational: false,
    },
    {
      name: "Other hydro (operational)",
      type: "hydro",
      capacity: 4.374,
      status: "operational",
      operational: true,
    },

    // --- Renewables ---
    {
      name: "Solar (aggregated)",
      type: "solar",
      capacity: 5.5,
      status: "reduced",
      operational: true,
    },
    {
      name: "Wind (aggregated)",
      type: "wind",
      capacity: 1.7,
      status: "reduced",
      operational: true,
    },
  ];
}

/**
 * Build the curated fallback response when live data is unavailable.
 *
 * Estimates are based on publicly available reports from Ukrenergo, IEA,
 * and IAEA (as of early 2025). Roughly 50% of thermal generation capacity
 * has been destroyed or severely damaged by Russian missile/drone strikes.
 */
function getCuratedFallback(): EnergyData {
  const plants = getCuratedPlants();

  const operationalCapacity = plants
    .filter((p) => p.operational)
    .reduce((sum, p) => sum + p.capacity, 0);

  const damagedCapacity = plants
    .filter((p) => !p.operational)
    .reduce((sum, p) => sum + p.capacity, 0);

  const nuclearOperational = plants
    .filter((p) => p.type === "nuclear" && p.operational)
    .reduce((sum, p) => sum + p.capacity, 0);

  const renewableOperational = plants
    .filter((p) => (p.type === "solar" || p.type === "wind" || p.type === "hydro") && p.operational)
    .reduce((sum, p) => sum + p.capacity, 0);

  const nuclearShare = Math.round((nuclearOperational / operationalCapacity) * 100);
  const renewableShare = Math.round((renewableOperational / operationalCapacity) * 100);

  const status: EnergyData["status"] =
    operationalCapacity < 20 ? "critical" : operationalCapacity < 40 ? "stressed" : "normal";

  return {
    totalCapacity: 55,
    currentGeneration: null,
    nuclearShare,
    renewableShare,
    status,
    plants,
    damagedCapacity: Math.round(damagedCapacity * 10) / 10,
    source: "curated",
    lastUpdated: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Historical energy snapshots for timeline playback
// ---------------------------------------------------------------------------

/**
 * Returns a curated energy snapshot reflecting the state of Ukraine's power
 * grid at the given date. Based on publicly documented strike campaigns and
 * infrastructure damage timelines.
 *
 * Key periods:
 * - Pre-war (before 20220224): Full capacity, all operational
 * - Early war (20220224–20221009): Zaporizhzhia occupied, minor thermal damage
 * - First energy campaign (20221010–20230605): Massive Oct-Mar strikes on thermal/hydro
 * - Post-Kakhovka (20230606–20240321): Kakhovka dam destroyed, some recovery
 * - Second energy campaign (20240322–present): Spring 2024 strikes destroy more capacity
 */
function getHistoricalEnergyData(dateStr: string): EnergyData {
  const plants = getCuratedPlants();

  if (dateStr < "20220224") {
    // Pre-war: everything operational
    for (const p of plants) {
      p.status = "operational";
      p.operational = true;
    }
  } else if (dateStr < "20221010") {
    // Early war: ZNPP occupied, Slovianska destroyed, minor damage
    for (const p of plants) {
      if (p.name === "Zaporizhzhia NPP") {
        p.status = "occupied";
        p.operational = false;
      } else if (p.name === "Slovianska TPS") {
        p.status = dateStr >= "20220601" ? "destroyed" : "damaged";
        p.operational = false;
      } else if (p.name === "Zmiyivska TPS" && dateStr >= "20220312") {
        p.status = "damaged";
        p.operational = false;
      } else {
        p.status = "operational";
        p.operational = true;
      }
    }
  } else if (dateStr < "20230606") {
    // First energy campaign: Oct 2022 massive strikes on thermal infrastructure
    for (const p of plants) {
      if (p.name === "Zaporizhzhia NPP") {
        p.status = "occupied";
        p.operational = false;
      } else if (p.name === "Slovianska TPS") {
        p.status = "destroyed";
        p.operational = false;
      } else if (p.name === "Zmiyivska TPS") {
        p.status = "damaged";
        p.operational = false;
      } else if (p.name === "Ladyzhyn TPS") {
        p.status = "damaged";
        p.operational = false;
      } else if (p.name === "Kryvorizka TPS") {
        p.status = "damaged";
        p.operational = false;
      } else if (p.name === "Dnipro HPP") {
        p.status = "damaged";
        p.operational = false;
      } else if (p.name === "Vuhlehirska TPS") {
        p.status = "damaged";
        p.operational = false;
      } else {
        p.status = p.status === "reduced" ? "reduced" : "operational";
        p.operational = true;
      }
    }
  } else if (dateStr < "20240322") {
    // Post-Kakhovka: dam destroyed, some partial recovery of thermal
    for (const p of plants) {
      if (p.name === "Zaporizhzhia NPP") {
        p.status = "occupied";
        p.operational = false;
      } else if (p.name === "Kakhovka HPP") {
        p.status = "destroyed";
        p.operational = false;
      } else if (p.name === "Slovianska TPS") {
        p.status = "destroyed";
        p.operational = false;
      } else if (
        ["Zmiyivska TPS", "Ladyzhyn TPS", "Vuhlehirska TPS", "Kryvorizka TPS"].includes(p.name)
      ) {
        p.status = "damaged";
        p.operational = false;
      } else if (p.name === "Dnipro HPP") {
        p.status = "damaged";
        p.operational = false;
      } else {
        p.status = p.status === "reduced" ? "reduced" : "operational";
        p.operational = true;
      }
    }
  }
  // else: use current curated status (default)

  const operationalCapacity = plants
    .filter((p) => p.operational)
    .reduce((s, p) => s + p.capacity, 0);
  const damagedCapacity = plants.filter((p) => !p.operational).reduce((s, p) => s + p.capacity, 0);

  const nuclearOp = plants
    .filter((p) => p.type === "nuclear" && p.operational)
    .reduce((s, p) => s + p.capacity, 0);
  const renewableOp = plants
    .filter((p) => (p.type === "solar" || p.type === "wind" || p.type === "hydro") && p.operational)
    .reduce((s, p) => s + p.capacity, 0);

  const nuclearShare =
    operationalCapacity > 0 ? Math.round((nuclearOp / operationalCapacity) * 100) : 0;
  const renewableShare =
    operationalCapacity > 0 ? Math.round((renewableOp / operationalCapacity) * 100) : 0;

  const status: EnergyData["status"] =
    operationalCapacity < 20 ? "critical" : operationalCapacity < 40 ? "stressed" : "normal";

  return {
    totalCapacity: 55,
    currentGeneration: null,
    nuclearShare,
    renewableShare,
    status,
    plants,
    damagedCapacity: Math.round(damagedCapacity * 10) / 10,
    source: "curated",
    lastUpdated: dateStr,
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  const limited = checkRateLimit(request, "energy", 30, 60_000);
  if (limited) return limited;

  // Check for historical date parameter (timeline playback)
  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");
  if (dateParam && /^\d{8}$/.test(dateParam)) {
    const data = getHistoricalEnergyData(dateParam);
    return NextResponse.json(data, {
      headers: { "X-Cache": "HISTORICAL", "Cache-Control": "public, max-age=86400" },
    });
  }

  try {
    // 1. Serve from fresh cache (current/live data only)
    const cached = await cacheGet<EnergyData>(CACHE_KEY);
    if (cached && isFresh(cached)) {
      return NextResponse.json(cached.data, {
        headers: { "X-Cache": "HIT", "Cache-Control": "public, max-age=1800" },
      });
    }

    // 2. Try ENTSO-E live data
    let data: EnergyData | null = null;
    try {
      data = await fetchFromEntsoe();
    } catch (err) {
      console.warn("[energy] ENTSO-E fetch failed, using fallback:", err);
    }

    // 3. Fall back to curated dataset if ENTSO-E unavailable
    if (!data) {
      data = getCuratedFallback();
    }

    // 4. Persist to cache
    await cacheSet(CACHE_KEY, data, CACHE_TTL);

    return NextResponse.json(data, {
      headers: { "X-Cache": "MISS", "Cache-Control": "public, max-age=1800" },
    });
  } catch (err) {
    console.error("[energy] Unhandled error:", err);

    // Last resort: serve stale cache if available
    const stale = await cacheGet<EnergyData>(CACHE_KEY);
    if (stale && isUsableStale(stale)) {
      return NextResponse.json(stale.data, {
        headers: { "X-Cache": "STALE-ERROR", "Cache-Control": "public, max-age=300" },
      });
    }

    // Absolute fallback: return curated data even on total failure
    return NextResponse.json(getCuratedFallback(), {
      headers: { "X-Cache": "FALLBACK", "Cache-Control": "public, max-age=300" },
    });
  }
}
