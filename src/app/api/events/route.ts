import { NextResponse } from "next/server";
import type { WarEvent } from "@/data/events";
import { KEY_EVENTS } from "@/data/events";
import { SEED_EVENTS } from "@/data/events-seed";
import { MISSILE_ATTACKS } from "@/data/missile-attacks";
import { fetchAcledPages } from "@/lib/acled";
import { cacheGet, cacheSet, isFresh, isUsableStale } from "@/lib/cache";
import { CACHE_TTL } from "@/lib/constants";
import type { AcledEvent } from "@/lib/types";

const WIKIDATA_SPARQL_URL = "https://query.wikidata.org/sparql";
const CACHE_KEY = "events";

// Dedup concurrent requests
let inflightEventsPromise: Promise<WarEvent[]> | null = null;

/**
 * SPARQL query for events that are "part of" the 2022 Russian invasion of Ukraine (Q110999040).
 * Filters for events with start dates and human-readable labels (not Q-codes).
 * Returns coordinates from the event itself or its location.
 */
const WIKIDATA_QUERY = `
SELECT ?event ?eventLabel ?eventDescription ?start ?coord ?casualties
WHERE {
  ?event wdt:P361+ wd:Q110999040 .
  ?event wdt:P580 ?start .
  OPTIONAL { ?event wdt:P625 ?coord . }
  OPTIONAL {
    ?event wdt:P276 ?location .
    ?location wdt:P625 ?coord .
  }
  OPTIONAL { ?event wdt:P1120 ?casualties . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY ?start
LIMIT 500
`.trim();

interface WikidataBinding {
  event: { value: string };
  eventLabel?: { value: string };
  eventDescription?: { value: string };
  start?: { value: string };
  coord?: { value: string };
  casualties?: { value: string };
}

/**
 * Parse a Wikidata Point string like "Point(33.586 45.089)" into { lat, lng }.
 */
function parseCoordinate(coord: string): { lat: number; lng: number } | null {
  const match = coord.match(/Point\(([-\d.]+)\s+([-\d.]+)\)/);
  if (!match) return null;
  const lng = parseFloat(match[1]);
  const lat = parseFloat(match[2]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

/**
 * Convert a date string to YYYYMMDD format.
 * Accepts ISO (2022-02-24T00:00:00Z) or YYYY-MM-DD.
 */
function toDateKey(dateStr: string): string {
  return dateStr.slice(0, 10).replace(/-/g, "");
}

/**
 * Fetch events from Wikidata SPARQL endpoint.
 */
async function fetchWikidataEvents(): Promise<WarEvent[]> {
  const params = new URLSearchParams({
    query: WIKIDATA_QUERY,
    format: "json",
  });

  const res = await fetch(`${WIKIDATA_SPARQL_URL}?${params.toString()}`, {
    headers: {
      Accept: "application/sparql-results+json",
      "User-Agent": "UkraineWarTracker/1.0 (https://ukrainewar.app)",
    },
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`Wikidata SPARQL error (${res.status}): ${await res.text()}`);
  }

  const json = await res.json();
  const bindings: WikidataBinding[] = json?.results?.bindings || [];

  const seen = new Map<string, WarEvent>();

  for (const binding of bindings) {
    const uri = binding.event.value;
    if (seen.has(uri)) continue;

    const label = binding.eventLabel?.value || "";
    // Skip unnamed items (Q-codes only)
    if (/^Q\d+$/.test(label)) continue;

    // Skip meta-articles (lists, overviews, protests)
    if (
      label.startsWith("list of") ||
      label.startsWith("foreign involvement") ||
      label.startsWith("support for") ||
      label.startsWith("humanitarian impact") ||
      label.startsWith("violations of") ||
      label.startsWith("war crimes in") ||
      label.startsWith("looting by") ||
      label.startsWith("sexual violence") ||
      label.startsWith("solidarity concerts") ||
      label.startsWith("aerial warfare") ||
      label.startsWith("nuclear risk") ||
      label.startsWith("Ghost of Kyiv") ||
      label.startsWith("protests against") ||
      label.startsWith("anti-war protests") ||
      label.startsWith("Spillover of")
    ) {
      continue;
    }

    const dateStr = binding.start?.value;
    if (!dateStr) continue;
    const date = toDateKey(dateStr);

    // Skip events before the invasion
    if (date < "20220224") continue;

    // Skip events with generic Jan 1 dates (likely represents the whole year)
    if (date.endsWith("0101") && date !== "20220101") continue;

    const description = binding.eventDescription?.value || "";
    const coord = binding.coord?.value ? parseCoordinate(binding.coord.value) : null;

    const event: WarEvent = {
      date,
      label,
      description: description.length > 200 ? `${description.slice(0, 197)}...` : description,
    };

    if (coord) {
      event.lat = Math.round(coord.lat * 100000) / 100000;
      event.lng = Math.round(coord.lng * 100000) / 100000;
    }

    seen.set(uri, event);
  }

  return Array.from(seen.values());
}

/**
 * Fetch high-impact events from ACLED API and convert to WarEvent format.
 * Filters for: battles with ≥30 fatalities, civilian violence with ≥5 fatalities,
 * agreements, and non-violent territory transfers.
 */
async function fetchAcledKeyEvents(): Promise<WarEvent[]> {
  const events: WarEvent[] = [];

  // Use the recency cutoff as the end date (free tier: 12 months back)
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  const endDate = cutoff.toISOString().slice(0, 10);

  // High-fatality battles and explosions (≥30 killed)
  const highFatality = await fetchAcledPages("2022-02-24", endDate, {
    fatalities: "30",
    fatalities_where: ">=",
  });

  // Violence against civilians (≥5 killed)
  const civilianViolence = await fetchAcledPages("2022-02-24", endDate, {
    event_type: "Violence against civilians",
    fatalities: "5",
    fatalities_where: ">=",
  });

  // Agreements and POW exchanges
  const agreements = await fetchAcledPages("2022-02-24", endDate, {
    event_type: "Strategic developments",
    sub_event_type: "Agreement",
  });

  // Non-violent territory transfers
  const transfers = await fetchAcledPages("2022-02-24", endDate, {
    event_type: "Strategic developments",
    sub_event_type: "Non-violent transfer of territory",
  });

  const allAcled = [...highFatality, ...civilianViolence, ...agreements, ...transfers];

  // Deduplicate by event_id
  const seenIds = new Set<string>();
  for (const ev of allAcled) {
    if (seenIds.has(ev.event_id)) continue;
    seenIds.add(ev.event_id);

    const dateKey = ev.event_date.replace(/-/g, "");
    if (dateKey < "20220224") continue;

    // Build a concise label from sub_event_type + location
    const label = buildAcledLabel(ev);
    const description = ev.notes.length > 200 ? `${ev.notes.slice(0, 197)}...` : ev.notes;

    events.push({
      date: dateKey,
      label,
      description,
      lat: ev.latitude,
      lng: ev.longitude,
    });
  }

  return events;
}

function buildAcledLabel(ev: AcledEvent): string {
  const location = ev.location || ev.admin1 || "Ukraine";
  if (ev.sub_event_type === "Agreement") {
    return `Agreement: ${location}`;
  }
  if (ev.sub_event_type === "Non-violent transfer of territory") {
    return `Territory transfer: ${location}`;
  }
  if (ev.event_type === "Violence against civilians") {
    return `Civilian attack: ${location}`;
  }
  if (ev.fatalities >= 50) {
    return `Major clash: ${location} (${ev.fatalities} killed)`;
  }
  return `${ev.sub_event_type}: ${location}`;
}

/**
 * Calculate distance between two points in km using the Haversine formula.
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
 * Convert massive/major missile attacks into WarEvent entries.
 * Only includes "massive" attacks to avoid flooding the timeline.
 */
function getMissileAttackEvents(): WarEvent[] {
  return MISSILE_ATTACKS.filter((a) => a.type === "massive").map((attack) => {
    const totalLaunched = attack.missiles.launched + attack.drones.launched;
    const totalIntercepted = attack.missiles.intercepted + attack.drones.intercepted;
    const rate = totalLaunched > 0 ? Math.round((totalIntercepted / totalLaunched) * 100) : 0;
    return {
      date: attack.date,
      label: `Massive aerial attack (${totalLaunched} projectiles)`,
      description: `${attack.description}. ${totalIntercepted}/${totalLaunched} intercepted (${rate}%). Targets: ${attack.targets.join(", ")}.`,
      lat: 50.45,
      lng: 30.52,
    };
  });
}

/**
 * Merge seed events into the Wikidata events, deduplicating by date + geo proximity.
 * Seed events take priority since they're curated.
 * Additional sources (ACLED) are merged after with same dedup logic.
 */
function mergeEvents(wikidata: WarEvent[], seed: WarEvent[], acled: WarEvent[] = []): WarEvent[] {
  const merged = [...seed];

  // Merge Wikidata events (dedup against seed)
  for (const event of [...wikidata, ...acled]) {
    const isDuplicate = merged.some((existing) => {
      const eDate = Number.parseInt(event.date, 10);
      const mDate = Number.parseInt(existing.date, 10);
      if (Math.abs(eDate - mDate) > 3) return false;

      // Check label similarity (case-insensitive substring match)
      const eLabel = event.label.toLowerCase();
      const mLabel = existing.label.toLowerCase();
      if (eLabel.includes(mLabel) || mLabel.includes(eLabel)) return true;

      // Check geo proximity if both have coordinates
      if (event.lat != null && event.lng != null && existing.lat != null && existing.lng != null) {
        const dist = haversineKm(event.lat, event.lng, existing.lat, existing.lng);
        if (dist < 50) return true;
      }

      return false;
    });

    if (!isDuplicate) {
      merged.push(event);
    }
  }

  return merged.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Main event aggregation pipeline.
 * Sources: Wikidata SPARQL + ACLED high-impact events + curated seed events.
 */
async function aggregateEvents(): Promise<WarEvent[]> {
  try {
    // Fetch Wikidata and ACLED in parallel
    const [wikidataEvents, acledEvents] = await Promise.all([
      fetchWikidataEvents().catch((err) => {
        console.error("[events] Wikidata fetch failed:", err);
        return [] as WarEvent[];
      }),
      fetchAcledKeyEvents().catch((err) => {
        console.error("[events] ACLED fetch failed:", err);
        return [] as WarEvent[];
      }),
    ]);

    const missileEvents = getMissileAttackEvents();
    console.log(
      `[events] Wikidata: ${wikidataEvents.length}, ACLED: ${acledEvents.length}, Missiles: ${missileEvents.length}, Seed: ${SEED_EVENTS.length}`,
    );

    const merged = mergeEvents(wikidataEvents, SEED_EVENTS, [...acledEvents, ...missileEvents]);
    console.log(`[events] Merged: ${merged.length} events (after dedup)`);

    // If all external sources failed, use fallback
    if (wikidataEvents.length === 0 && acledEvents.length === 0) {
      console.warn("[events] All external sources failed, using fallback");
      return KEY_EVENTS;
    }

    return merged;
  } catch (error) {
    console.error("[events] Aggregation failed, using fallback:", error);
    return KEY_EVENTS;
  }
}

export async function GET() {
  try {
    const cached = await cacheGet<WarEvent[]>(CACHE_KEY);

    if (cached && isFresh(cached)) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": `public, s-maxage=${CACHE_TTL.EVENTS}, stale-while-revalidate=3600`,
          "X-Cache": "HIT",
          "X-Events-Count": String(cached.data.length),
        },
      });
    }

    if (cached && isUsableStale(cached)) {
      // Refresh in background, serve stale immediately
      if (!inflightEventsPromise) {
        inflightEventsPromise = aggregateEvents()
          .then(async (events) => {
            await cacheSet(CACHE_KEY, events, CACHE_TTL.EVENTS);
            return events;
          })
          .catch((err) => {
            console.error("[events] Background refresh failed:", err);
            return cached.data;
          })
          .finally(() => {
            inflightEventsPromise = null;
          });
      }

      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": `public, s-maxage=3600, stale-while-revalidate=${CACHE_TTL.EVENTS}`,
          "X-Cache": "STALE",
          "X-Events-Count": String(cached.data.length),
        },
      });
    }

    // Cold start — fetch, cache, and respond
    let events: WarEvent[];
    if (inflightEventsPromise) {
      events = await inflightEventsPromise;
    } else {
      inflightEventsPromise = aggregateEvents();
      try {
        events = await inflightEventsPromise;
      } finally {
        inflightEventsPromise = null;
      }
    }

    await cacheSet(CACHE_KEY, events, CACHE_TTL.EVENTS);

    return NextResponse.json(events, {
      headers: {
        "Cache-Control": `public, s-maxage=${CACHE_TTL.EVENTS}, stale-while-revalidate=3600`,
        "X-Cache": "MISS",
        "X-Events-Count": String(events.length),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch events";
    console.error("[events] API error:", message);

    // Try stale persistent cache before falling back to hardcoded
    const stale = await cacheGet<WarEvent[]>(CACHE_KEY);
    if (stale) {
      return NextResponse.json(stale.data, {
        headers: {
          "Cache-Control": "public, s-maxage=3600",
          "X-Cache": "ERROR-STALE",
          "X-Events-Count": String(stale.data.length),
        },
      });
    }

    return NextResponse.json(KEY_EVENTS, {
      headers: {
        "Cache-Control": "public, s-maxage=3600",
        "X-Cache": "FALLBACK",
        "X-Events-Count": String(KEY_EVENTS.length),
      },
    });
  }
}
