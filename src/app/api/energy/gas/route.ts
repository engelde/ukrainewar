import { NextResponse } from "next/server";
import { cacheGet, cacheSet, isFresh, isUsableStale } from "@/lib/cache";

/**
 * Ukraine Gas Transit API
 *
 * Fetches natural gas physical flow data through Ukraine from the
 * ENTSOG Transparency Platform. Ukraine is a major gas transit country —
 * Russian gas flows through Ukraine to Europe via the Brotherhood and
 * Soyuz pipeline systems.
 *
 * In January 2025, the Ukraine-Russia gas transit agreement expired,
 * ending most Russian gas flows through Ukraine.
 *
 * ENTSOG API docs: https://transparency.entsog.eu/api/v1
 * No authentication required — free public API.
 *
 * Key interconnection points:
 *   Sudzha          ITP-00530  (Russia → Ukraine entry)
 *   Velke Kapusany  ITP-00096  (Ukraine → Slovakia exit)
 *   Uzhhorod        ITP-00532  (Ukraine → Slovakia/Hungary exit)
 *
 * Returns daily physical flow data, transit status, and 30-day history.
 */

const CACHE_KEY = "gas:ukraine";
const CACHE_TTL = 12 * 60 * 60; // 12 hours (gas data updates daily)

// ---------------------------------------------------------------------------
// ENTSOG configuration
// ---------------------------------------------------------------------------

const ENTSOG_BASE = "https://transparency.entsog.eu/api/v1";
const UA_OPERATOR = "21X-UA-TRANSGAZ";

interface GasPoint {
  name: string;
  id: string;
  flowMcm: number | null;
  direction: "entry" | "exit";
  status: "flowing" | "reduced" | "stopped";
}

interface GasHistoryEntry {
  date: string;
  flowMcm: number;
}

interface GasData {
  transitStatus: "active" | "reduced" | "minimal" | "stopped";
  dailyFlowMcm: number | null;
  peakFlowMcm: number;
  points: GasPoint[];
  history: GasHistoryEntry[];
  source: "ENTSOG" | "curated";
  lastUpdated: string;
}

const INTERCONNECTION_POINTS = [
  { name: "Sudzha (RU→UA entry)", id: "ITP-00530", direction: "entry" as const },
  { name: "Velke Kapusany (UA→SK exit)", id: "ITP-00096", direction: "exit" as const },
  { name: "Uzhhorod (UA→SK/HU exit)", id: "ITP-00532", direction: "exit" as const },
];

/** Historical peak for context: pre-war transit ~109 mcm/day (2021 average) */
const PEAK_FLOW_MCM = 109;

// ---------------------------------------------------------------------------
// ENTSOG fetching
// ---------------------------------------------------------------------------

/** Format a Date as YYYY-MM-DD for ENTSOG queries. */
function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Fetch physical flow data from ENTSOG for a single interconnection point.
 * Returns an array of { date, value } entries (kWh/day).
 *
 * ENTSOG returns JSON with an `operationaldata` array.
 */
async function fetchPointFlows(
  pointId: string,
  from: string,
  to: string,
): Promise<{ date: string; value: number }[]> {
  const params = new URLSearchParams({
    from,
    to,
    indicator: "Physical Flow",
    periodType: "day",
    operatorKey: UA_OPERATOR,
    pointKey: pointId,
    limit: "-1",
  });

  const url = `${ENTSOG_BASE}/operationaldata?${params.toString()}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    console.warn(`[gas] ENTSOG responded ${res.status} for point ${pointId}`);
    return [];
  }

  const json = await res.json();
  const entries: { date: string; value: number }[] = [];

  if (!json.operationalData || !Array.isArray(json.operationalData)) {
    return [];
  }

  for (const record of json.operationalData) {
    const periodFrom = record.periodFrom;
    const value = record.value;
    if (periodFrom && typeof value === "number" && value >= 0) {
      entries.push({ date: periodFrom.slice(0, 10), value });
    }
  }

  return entries;
}

/**
 * Convert kWh/day to million cubic meters/day.
 * 1 mcm ≈ 10.55 GWh (using standard gross calorific value for natural gas).
 */
function kwhToMcm(kwh: number): number {
  return Math.round((kwh / 10_550_000_000) * 100) / 100;
}

/** Derive point status from flow value. */
function pointStatus(flowMcm: number | null): GasPoint["status"] {
  if (flowMcm === null || flowMcm <= 0.1) return "stopped";
  if (flowMcm < 10) return "reduced";
  return "flowing";
}

/** Derive overall transit status from total daily flow. */
function transitStatus(dailyMcm: number | null): GasData["transitStatus"] {
  if (dailyMcm === null || dailyMcm <= 0.5) return "stopped";
  if (dailyMcm < 10) return "minimal";
  if (dailyMcm < 80) return "reduced";
  return "active";
}

/**
 * Fetch flow data from ENTSOG for all key interconnection points.
 * Aggregates into the response format with 30-day history.
 */
async function fetchFromEntsog(): Promise<GasData | null> {
  const now = new Date();
  const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const fromStr = fmtDate(from);
  const toStr = fmtDate(now);

  // Fetch all points in parallel
  const results = await Promise.all(
    INTERCONNECTION_POINTS.map(async (point) => {
      const flows = await fetchPointFlows(point.id, fromStr, toStr);
      return { ...point, flows };
    }),
  );

  // Check if we got any data at all
  const totalEntries = results.reduce((sum, r) => sum + r.flows.length, 0);
  if (totalEntries === 0) return null;

  // Build daily aggregated history from the entry point (Sudzha) for simplicity,
  // as it represents the total Russian gas entering Ukraine
  const entryPoint = results.find((r) => r.id === "ITP-00530");
  const dailyMap = new Map<string, number>();

  if (entryPoint) {
    for (const flow of entryPoint.flows) {
      const existing = dailyMap.get(flow.date) ?? 0;
      dailyMap.set(flow.date, existing + flow.value);
    }
  }

  // Fall back to aggregating exit points if Sudzha data unavailable
  if (dailyMap.size === 0) {
    for (const point of results.filter((r) => r.direction === "exit")) {
      for (const flow of point.flows) {
        const existing = dailyMap.get(flow.date) ?? 0;
        dailyMap.set(flow.date, existing + flow.value);
      }
    }
  }

  const history: GasHistoryEntry[] = Array.from(dailyMap.entries())
    .map(([date, kwh]) => ({ date, flowMcm: kwhToMcm(kwh) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Latest day's flow
  const latestFlow = history.length > 0 ? history[history.length - 1].flowMcm : null;

  // Build per-point summary using the most recent data
  const points: GasPoint[] = results.map((r) => {
    const latestEntry = r.flows.slice().sort((a, b) => b.date.localeCompare(a.date))[0];
    const flowMcm = latestEntry ? kwhToMcm(latestEntry.value) : null;
    return {
      name: r.name,
      id: r.id,
      flowMcm,
      direction: r.direction,
      status: pointStatus(flowMcm),
    };
  });

  return {
    transitStatus: transitStatus(latestFlow),
    dailyFlowMcm: latestFlow,
    peakFlowMcm: PEAK_FLOW_MCM,
    points,
    history,
    source: "ENTSOG",
    lastUpdated: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Curated static fallback
// ---------------------------------------------------------------------------

/**
 * Build a curated fallback reflecting known gas transit milestones.
 *
 * Sources: ENTSOG historical data, Naftogaz/GTSOU public reports, media.
 *
 * Timeline:
 *   Pre-war (2021): ~109 mcm/day average transit
 *   Post-invasion (Mar 2022): dropped to ~42 mcm/day via Sudzha only
 *     (Sokhranovka entry closed after Luhansk occupation)
 *   Aug 2024: Sudzha captured during Kursk incursion — further reduction
 *   Jan 1, 2025: Transit agreement expired — flows dropped to near zero
 */
function getCuratedFallback(): GasData {
  const now = new Date();
  const transitDealExpiry = new Date("2025-01-01T00:00:00Z");

  // After transit deal expiry: flows are near zero
  const isPostExpiry = now >= transitDealExpiry;

  const dailyFlowMcm = isPostExpiry ? 0 : 42;
  const status = isPostExpiry ? "stopped" : "reduced";
  const pointFlowStatus = isPostExpiry ? "stopped" : "reduced";

  const points: GasPoint[] = [
    {
      name: "Sudzha (RU→UA entry)",
      id: "ITP-00530",
      flowMcm: isPostExpiry ? 0 : 42,
      direction: "entry",
      status: pointFlowStatus,
    },
    {
      name: "Velke Kapusany (UA→SK exit)",
      id: "ITP-00096",
      flowMcm: isPostExpiry ? 0 : 37,
      direction: "exit",
      status: pointFlowStatus,
    },
    {
      name: "Uzhhorod (UA→SK/HU exit)",
      id: "ITP-00532",
      flowMcm: isPostExpiry ? 0 : 5,
      direction: "exit",
      status: pointFlowStatus,
    },
  ];

  // Generate synthetic 30-day history for context
  const history: GasHistoryEntry[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    history.push({
      date: fmtDate(date),
      flowMcm: date >= transitDealExpiry ? 0 : 42,
    });
  }

  return {
    transitStatus: status as GasData["transitStatus"],
    dailyFlowMcm,
    peakFlowMcm: PEAK_FLOW_MCM,
    points,
    history,
    source: "curated",
    lastUpdated: now.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    // 1. Serve from fresh cache
    const cached = await cacheGet<GasData>(CACHE_KEY);
    if (cached && isFresh(cached)) {
      return NextResponse.json(cached.data, {
        headers: { "X-Cache": "HIT", "Cache-Control": "public, max-age=1800" },
      });
    }

    // 2. Try ENTSOG live data
    let data: GasData | null = null;
    try {
      data = await fetchFromEntsog();
    } catch (err) {
      console.warn("[gas] ENTSOG fetch failed, using fallback:", err);
    }

    // 3. Fall back to curated dataset if ENTSOG unavailable
    if (!data) {
      data = getCuratedFallback();
    }

    // 4. Persist to cache
    await cacheSet(CACHE_KEY, data, CACHE_TTL);

    return NextResponse.json(data, {
      headers: { "X-Cache": "MISS", "Cache-Control": "public, max-age=1800" },
    });
  } catch (err) {
    console.error("[gas] Unhandled error:", err);

    // Last resort: serve stale cache if available
    const stale = await cacheGet<GasData>(CACHE_KEY);
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
