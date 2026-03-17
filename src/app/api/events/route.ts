import { NextResponse } from "next/server";
import type { WarEvent } from "@/data/events";
import { KEY_EVENTS } from "@/data/events";
import { SEED_EVENTS } from "@/data/events-seed";
import { CACHE_TTL } from "@/lib/constants";

const WIKIDATA_SPARQL_URL = "https://query.wikidata.org/sparql";

// In-memory cache
let cachedEvents: { data: WarEvent[]; timestamp: number } | null = null;
const CACHE_DURATION_MS = CACHE_TTL.EVENTS * 1000; // 24 hours

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
 * Merge seed events into the Wikidata events, deduplicating by date + geo proximity.
 * Seed events take priority since they're curated.
 */
function mergeEvents(wikidata: WarEvent[], seed: WarEvent[]): WarEvent[] {
  const merged = [...seed];

  for (const wEvent of wikidata) {
    const isDuplicate = merged.some((sEvent) => {
      // Check date proximity (within 3 days)
      const wDate = parseInt(wEvent.date, 10);
      const sDate = parseInt(sEvent.date, 10);
      if (Math.abs(wDate - sDate) > 3) return false;

      // Check label similarity (case-insensitive substring match)
      const wLabel = wEvent.label.toLowerCase();
      const sLabel = sEvent.label.toLowerCase();
      if (wLabel.includes(sLabel) || sLabel.includes(wLabel)) return true;

      // Check geo proximity if both have coordinates
      if (wEvent.lat != null && wEvent.lng != null && sEvent.lat != null && sEvent.lng != null) {
        const dist = haversineKm(wEvent.lat, wEvent.lng, sEvent.lat, sEvent.lng);
        if (dist < 50) return true;
      }

      return false;
    });

    if (!isDuplicate) {
      merged.push(wEvent);
    }
  }

  return merged.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Main event aggregation pipeline.
 */
async function aggregateEvents(): Promise<WarEvent[]> {
  try {
    const wikidataEvents = await fetchWikidataEvents();
    console.log(`[events] Wikidata: ${wikidataEvents.length} events`);

    const merged = mergeEvents(wikidataEvents, SEED_EVENTS);
    console.log(
      `[events] Merged: ${merged.length} events (${SEED_EVENTS.length} seed + ${wikidataEvents.length} wikidata, after dedup)`,
    );

    return merged;
  } catch (error) {
    console.error("[events] Aggregation failed, using fallback:", error);
    return KEY_EVENTS;
  }
}

export async function GET() {
  try {
    // Check cache
    if (cachedEvents && Date.now() - cachedEvents.timestamp < CACHE_DURATION_MS) {
      return NextResponse.json(cachedEvents.data, {
        headers: {
          "Cache-Control": `public, s-maxage=${CACHE_TTL.EVENTS}, stale-while-revalidate=3600`,
          "X-Cache": "HIT",
          "X-Events-Count": String(cachedEvents.data.length),
        },
      });
    }

    const events = await aggregateEvents();

    // Update cache
    cachedEvents = { data: events, timestamp: Date.now() };

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

    // Return fallback hardcoded events
    return NextResponse.json(KEY_EVENTS, {
      headers: {
        "Cache-Control": "public, s-maxage=3600",
        "X-Cache": "FALLBACK",
        "X-Events-Count": String(KEY_EVENTS.length),
      },
    });
  }
}
