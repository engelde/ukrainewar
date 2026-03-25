import { NextResponse } from "next/server";
import type { Battle } from "@/data/battles";
import { MAJOR_BATTLES } from "@/data/battles";
import { fetchAcledPages } from "@/lib/acled";
import { cacheGet, cacheSet, isFresh, isUsableStale } from "@/lib/cache";
import { CACHE_TTL } from "@/lib/constants";
import type { AcledEvent } from "@/lib/types";

const CACHE_KEY = "battles";
const ACLED_BATTLE_FATALITY_THRESHOLD = 10;
const DEDUP_DISTANCE_KM = 50;
const DEDUP_DATE_RANGE_DAYS = 7;

let inflightBattlesPromise: Promise<Battle[]> | null = null;

/**
 * Compute the latest startDate among all static battles.
 * ACLED battle events are only included after this date to avoid
 * duplicating curated entries.
 */
function getStaticCutoffDate(): string {
  let latest = "00000000";
  for (const b of MAJOR_BATTLES) {
    if (b.startDate > latest) latest = b.startDate;
  }
  return latest;
}

/**
 * Haversine distance between two points in km.
 */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Parse YYYYMMDD date key to a simple comparable integer (days since epoch-ish).
 */
function dateKeyToDays(dateKey: string): number {
  const y = Number.parseInt(dateKey.slice(0, 4), 10);
  const m = Number.parseInt(dateKey.slice(4, 6), 10);
  const d = Number.parseInt(dateKey.slice(6, 8), 10);
  return y * 365 + m * 30 + d;
}

/**
 * Assign significance tier based on fatality count.
 */
function fatalitiesToSignificance(fatalities: number): Battle["significance"] {
  if (fatalities >= 50) return "critical";
  if (fatalities >= 25) return "major";
  return "significant";
}

/**
 * Convert an ACLED battle event to the Battle interface.
 */
function acledToBattle(ev: AcledEvent): Battle {
  const dateKey = ev.event_date.replace(/-/g, "");
  const location = ev.location || ev.admin1 || "Ukraine";

  return {
    id: `acled-${ev.event_id}`,
    name: `Battle of ${location}`,
    startDate: dateKey,
    endDate: dateKey,
    lat: ev.latitude,
    lng: ev.longitude,
    description: `${ev.sub_event_type} near ${location}. ${ev.actor1}${ev.actor2 ? ` vs ${ev.actor2}` : ""}. ${ev.fatalities} fatalities reported.`,
    significance: fatalitiesToSignificance(ev.fatalities),
    source: "acled",
    fatalities: ev.fatalities,
  };
}

/**
 * Check if an ACLED-derived battle duplicates an existing battle
 * (within 50km and 7 days).
 */
function isDuplicateBattle(candidate: Battle, existing: Battle[]): boolean {
  const cDays = dateKeyToDays(candidate.startDate);

  return existing.some((b) => {
    // Check date proximity: candidate date must be within the battle's
    // date range ± DEDUP_DATE_RANGE_DAYS buffer
    const startDays = dateKeyToDays(b.startDate);
    const endDays = b.endDate ? dateKeyToDays(b.endDate) : startDays;
    const withinDateRange =
      cDays >= startDays - DEDUP_DATE_RANGE_DAYS && cDays <= endDays + DEDUP_DATE_RANGE_DAYS;
    if (!withinDateRange) return false;

    // Check geographic proximity
    const dist = haversineKm(candidate.lat, candidate.lng, b.lat, b.lng);
    return dist < DEDUP_DISTANCE_KM;
  });
}

/**
 * Fetch high-fatality ACLED battle events and convert to Battle format.
 * Only includes events after the latest static battle start date.
 */
async function fetchAcledBattles(): Promise<Battle[]> {
  const cutoffDate = getStaticCutoffDate();
  // Convert YYYYMMDD → YYYY-MM-DD for ACLED API
  const startDate = `${cutoffDate.slice(0, 4)}-${cutoffDate.slice(4, 6)}-${cutoffDate.slice(6, 8)}`;

  // Use the ACLED free-tier recency limit as end date
  const now = new Date();
  const recencyCutoff = new Date(now);
  recencyCutoff.setFullYear(recencyCutoff.getFullYear() - 1);
  const endDate = recencyCutoff.toISOString().slice(0, 10);

  // Don't fetch if static data already covers beyond the ACLED window
  if (startDate > endDate) return [];

  const events = await fetchAcledPages(startDate, endDate, {
    event_type: "Battles",
    fatalities: String(ACLED_BATTLE_FATALITY_THRESHOLD),
    fatalities_where: ">=",
  });

  return events.map(acledToBattle);
}

/**
 * Merge static battles with ACLED-derived battles, deduplicating by proximity.
 */
function mergeBattles(staticBattles: Battle[], acledBattles: Battle[]): Battle[] {
  const merged: Battle[] = staticBattles.map((b) => ({ ...b, source: "static" as const }));

  for (const candidate of acledBattles) {
    if (!isDuplicateBattle(candidate, merged)) {
      merged.push(candidate);
    }
  }

  return merged.sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/**
 * Main aggregation pipeline: static battles + ACLED battle events.
 */
async function aggregateBattles(): Promise<Battle[]> {
  try {
    const acledBattles = await fetchAcledBattles().catch((err) => {
      console.error("[battles] ACLED fetch failed:", err);
      return [] as Battle[];
    });

    console.log(`[battles] Static: ${MAJOR_BATTLES.length}, ACLED: ${acledBattles.length}`);

    const merged = mergeBattles(MAJOR_BATTLES, acledBattles);

    console.log(`[battles] Merged: ${merged.length} battles (after dedup)`);
    return merged;
  } catch (error) {
    console.error("[battles] Aggregation failed, using static fallback:", error);
    return MAJOR_BATTLES;
  }
}

export async function GET() {
  try {
    const cached = await cacheGet<Battle[]>(CACHE_KEY);

    if (cached && isFresh(cached)) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": `public, s-maxage=${CACHE_TTL.BATTLES}, stale-while-revalidate=3600`,
          "X-Cache": "HIT",
          "X-Battles-Count": String(cached.data.length),
        },
      });
    }

    if (cached && isUsableStale(cached)) {
      if (!inflightBattlesPromise) {
        inflightBattlesPromise = aggregateBattles()
          .then(async (battles) => {
            await cacheSet(CACHE_KEY, battles, CACHE_TTL.BATTLES);
            return battles;
          })
          .catch((err) => {
            console.error("[battles] Background refresh failed:", err);
            return cached.data;
          })
          .finally(() => {
            inflightBattlesPromise = null;
          });
      }

      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": `public, s-maxage=3600, stale-while-revalidate=${CACHE_TTL.BATTLES}`,
          "X-Cache": "STALE",
          "X-Battles-Count": String(cached.data.length),
        },
      });
    }

    let battles: Battle[];
    if (inflightBattlesPromise) {
      battles = await inflightBattlesPromise;
    } else {
      inflightBattlesPromise = aggregateBattles();
      try {
        battles = await inflightBattlesPromise;
      } finally {
        inflightBattlesPromise = null;
      }
    }

    await cacheSet(CACHE_KEY, battles, CACHE_TTL.BATTLES);

    return NextResponse.json(battles, {
      headers: {
        "Cache-Control": `public, s-maxage=${CACHE_TTL.BATTLES}, stale-while-revalidate=3600`,
        "X-Cache": "MISS",
        "X-Battles-Count": String(battles.length),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch battles";
    console.error("[battles] API error:", message);

    const stale = await cacheGet<Battle[]>(CACHE_KEY);
    if (stale) {
      return NextResponse.json(stale.data, {
        headers: {
          "Cache-Control": "public, s-maxage=3600",
          "X-Cache": "ERROR-STALE",
          "X-Battles-Count": String(stale.data.length),
        },
      });
    }

    return NextResponse.json(MAJOR_BATTLES, {
      headers: {
        "Cache-Control": "public, s-maxage=3600",
        "X-Cache": "FALLBACK",
        "X-Battles-Count": String(MAJOR_BATTLES.length),
      },
    });
  }
}
