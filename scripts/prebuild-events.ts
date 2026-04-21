#!/usr/bin/env npx tsx

/**
 * Pre-builds event and ACLED map data snapshots.
 *
 * Requires ACLED_EMAIL and ACLED_PASSWORD in .env.local.
 * Outputs:
 *   - public/data/events.json   (~200KB) — merged war events for timeline
 *   - public/data/acled-map.json (~2MB)  — ACLED conflict GeoJSON for map
 *
 * These snapshots are committed to the repo and imported at bundle time,
 * giving users instant data on page load. The cron worker refreshes KV
 * cache periodically for freshness, but the bundled data ensures there
 * is never a 30+ second cold start.
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";

// Load .env.local for ACLED credentials
config({ path: join(process.cwd(), ".env.local") });

const ACLED_API = "https://acleddata.com/api/acled/read";
const ACLED_AUTH_URL = "https://acleddata.com/oauth/token";
const WIKIDATA_SPARQL_URL = "https://query.wikidata.org/sparql";

// --- ACLED auth ---

async function getAcledToken(): Promise<string> {
  const email = process.env.ACLED_EMAIL;
  const password = process.env.ACLED_PASSWORD;
  if (!email || !password) throw new Error("ACLED_EMAIL and ACLED_PASSWORD required in .env.local");

  const res = await fetch(ACLED_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      username: email,
      password: password,
      grant_type: "password",
      client_id: "acled",
    }),
  });

  if (!res.ok) throw new Error(`ACLED auth failed: ${res.status}`);
  const json = await res.json();
  return json.access_token;
}

// --- ACLED map data (fatalities >= 5, lightweight) ---

interface AcledRow {
  event_id_cnty: string;
  event_date: string;
  event_type: string;
  sub_event_type: string;
  actor1: string;
  actor2: string;
  location: string;
  latitude: string;
  longitude: string;
  fatalities: string;
  admin1: string;
  notes?: string;
}

async function fetchAcledPaginated(
  token: string,
  start: string,
  end: string,
  extraParams: Record<string, string> = {},
  fields = "event_id_cnty|event_date|event_type|sub_event_type|actor1|actor2|location|latitude|longitude|fatalities|admin1",
): Promise<AcledRow[]> {
  const all: AcledRow[] = [];
  const seen = new Set<string>();
  let page = 0;
  const limit = 10000;

  while (true) {
    const params = new URLSearchParams({
      country: "Ukraine",
      event_date: `${start}|${end}`,
      event_date_where: "BETWEEN",
      limit: String(limit),
      offset: String(page * limit),
      fields,
      ...extraParams,
    });

    const res = await fetch(`${ACLED_API}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`ACLED API error: ${res.status}`);
    const json = await res.json();
    const rows: AcledRow[] = json.data || [];
    if (rows.length === 0) break;

    let newCount = 0;
    for (const row of rows) {
      if (seen.has(row.event_id_cnty)) continue;
      seen.add(row.event_id_cnty);
      all.push(row);
      newCount++;
    }

    if (newCount === 0 || rows.length < limit) break;
    page++;
  }

  return all;
}

async function buildAcledMap(token: string): Promise<GeoJSON.FeatureCollection> {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  const end = cutoff.toISOString().slice(0, 10);

  console.log(`  Fetching ACLED map data (2022-02-24 to ${end}, fatalities >= 5)...`);
  const rows = await fetchAcledPaginated(token, "2022-02-24", end, {
    fatalities: "5",
    fatalities_where: ">=",
  });

  console.log(`  ${rows.length} events fetched`);

  return {
    type: "FeatureCollection",
    features: rows
      .map((e) => {
        const lat = Number.parseFloat(e.latitude);
        const lng = Number.parseFloat(e.longitude);
        if (Number.isNaN(lat) || Number.isNaN(lng) || (lat === 0 && lng === 0)) return null;
        return {
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: [lng, lat] },
          properties: {
            id: e.event_id_cnty,
            date: e.event_date,
            type: e.event_type,
            subtype: e.sub_event_type,
            actor1: e.actor1,
            actor2: e.actor2 || "",
            location: e.location,
            fatalities: Number.parseInt(e.fatalities, 10) || 0,
            admin1: e.admin1,
          },
        };
      })
      .filter(Boolean) as GeoJSON.Feature[],
  };
}

// --- Events ---

interface WarEvent {
  date: string;
  label: string;
  description: string;
  lat?: number;
  lng?: number;
  highlight?: boolean;
}

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

function parseCoordinate(coord: string): { lat: number; lng: number } | null {
  const match = coord.match(/Point\(([-\d.]+)\s+([-\d.]+)\)/);
  if (!match) return null;
  const lng = Number.parseFloat(match[1]);
  const lat = Number.parseFloat(match[2]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

function toDateKey(dateStr: string): string {
  return dateStr.slice(0, 10).replace(/-/g, "");
}

async function fetchWikidataEvents(): Promise<WarEvent[]> {
  console.log("  Fetching Wikidata SPARQL events...");
  const params = new URLSearchParams({ query: WIKIDATA_QUERY, format: "json" });
  const res = await fetch(`${WIKIDATA_SPARQL_URL}?${params}`, {
    headers: {
      Accept: "application/sparql-results+json",
      "User-Agent": "UkraineWarTracker/1.0 (https://ukrainewar.app)",
    },
  });

  if (!res.ok) throw new Error(`Wikidata error: ${res.status}`);
  const json = await res.json();
  const bindings = json?.results?.bindings || [];

  const seen = new Map<string, WarEvent>();
  const metaPrefixes = [
    "list of",
    "foreign involvement",
    "support for",
    "humanitarian impact",
    "violations of",
    "war crimes in",
    "looting by",
    "sexual violence",
    "solidarity concerts",
    "aerial warfare",
    "nuclear risk",
    "Ghost of Kyiv",
    "protests against",
    "anti-war protests",
    "Spillover of",
  ];

  for (const b of bindings) {
    const uri = b.event.value;
    if (seen.has(uri)) continue;
    const label = b.eventLabel?.value || "";
    if (/^Q\d+$/.test(label)) continue;
    if (metaPrefixes.some((p) => label.startsWith(p))) continue;
    const dateStr = b.start?.value;
    if (!dateStr) continue;
    const date = toDateKey(dateStr);
    if (date < "20220224") continue;
    if (date.endsWith("0101") && date !== "20220101") continue;

    const description = b.eventDescription?.value || "";
    const coord = b.coord?.value ? parseCoordinate(b.coord.value) : null;

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

  console.log(`  ${seen.size} Wikidata events`);
  return Array.from(seen.values());
}

async function fetchAcledKeyEvents(token: string): Promise<WarEvent[]> {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  const endDate = cutoff.toISOString().slice(0, 10);
  const allFields =
    "event_id_cnty|event_date|event_type|sub_event_type|actor1|actor2|location|latitude|longitude|fatalities|notes|admin1";

  console.log(
    "  Fetching ACLED key events (high-fatality battles, civilian violence, agreements)...",
  );

  const [highFatality, civilianViolence, agreements, transfers] = await Promise.all([
    fetchAcledPaginated(
      token,
      "2022-02-24",
      endDate,
      { fatalities: "30", fatalities_where: ">=" },
      allFields,
    ),
    fetchAcledPaginated(
      token,
      "2022-02-24",
      endDate,
      { event_type: "Violence against civilians", fatalities: "5", fatalities_where: ">=" },
      allFields,
    ),
    fetchAcledPaginated(
      token,
      "2022-02-24",
      endDate,
      { event_type: "Strategic developments", sub_event_type: "Agreement" },
      allFields,
    ),
    fetchAcledPaginated(
      token,
      "2022-02-24",
      endDate,
      { event_type: "Strategic developments", sub_event_type: "Non-violent transfer of territory" },
      allFields,
    ),
  ]);

  const all = [...highFatality, ...civilianViolence, ...agreements, ...transfers];
  const seenIds = new Set<string>();
  const events: WarEvent[] = [];

  for (const ev of all) {
    if (seenIds.has(ev.event_id_cnty)) continue;
    seenIds.add(ev.event_id_cnty);
    const dateKey = ev.event_date.replace(/-/g, "");
    if (dateKey < "20220224") continue;

    const location = ev.location || ev.admin1 || "Ukraine";
    const fatalities = Number.parseInt(ev.fatalities, 10) || 0;
    let label: string;
    if (ev.sub_event_type === "Agreement") label = `Agreement: ${location}`;
    else if (ev.sub_event_type === "Non-violent transfer of territory")
      label = `Territory transfer: ${location}`;
    else if (ev.event_type === "Violence against civilians") label = `Civilian attack: ${location}`;
    else if (fatalities >= 50) label = `Major clash: ${location} (${fatalities} killed)`;
    else label = `${ev.sub_event_type}: ${location}`;

    const description =
      (ev.notes || "").length > 200 ? `${(ev.notes || "").slice(0, 197)}...` : ev.notes || "";

    events.push({
      date: dateKey,
      label,
      description,
      lat: Number.parseFloat(ev.latitude),
      lng: Number.parseFloat(ev.longitude),
    });
  }

  console.log(`  ${events.length} ACLED key events`);
  return events;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function mergeEvents(wikidata: WarEvent[], seed: WarEvent[], acled: WarEvent[]): WarEvent[] {
  const merged = [...seed];
  for (const event of [...wikidata, ...acled]) {
    const isDuplicate = merged.some((existing) => {
      const eDate = Number.parseInt(event.date, 10);
      const mDate = Number.parseInt(existing.date, 10);
      if (Math.abs(eDate - mDate) > 3) return false;
      const eLabel = event.label.toLowerCase();
      const mLabel = existing.label.toLowerCase();
      if (eLabel.includes(mLabel) || mLabel.includes(eLabel)) return true;
      if (event.lat != null && event.lng != null && existing.lat != null && existing.lng != null) {
        if (haversineKm(event.lat, event.lng, existing.lat, existing.lng) < 50) return true;
      }
      return false;
    });
    if (!isDuplicate) merged.push(event);
  }
  return merged.sort((a, b) => a.date.localeCompare(b.date));
}

// --- Main ---

// --- GeoConfirmed (post-ACLED gap fill) ---

import { fetchGeoConfirmedEvents, type GeoConfirmedEvent } from "./fetch-geoconfirmed";

/**
 * Score a GeoConfirmed event by significance. Higher = more timeline-worthy.
 * Designed to mirror the ACLED filtering criteria already used elsewhere in
 * this script: high-fatality battles, civilian violence, strategic strikes,
 * and named platform losses.
 */
export function scoreGeoConfirmedEvent(e: GeoConfirmedEvent): number {
  const desc = e.description.toLowerCase();
  let score = 0;

  // Hard filters (return -Infinity to drop entirely)
  const isDroneIntercept =
    e.iconType?.toLowerCase().includes("droneintercept") ||
    /\bdrone (?:intercept|targeted by|hit by)/.test(desc) ||
    /intercepted by .* drone/.test(desc);
  if (isDroneIntercept) return Number.NEGATIVE_INFINITY;
  // Bare observation/recon — "rough grid", individual soldier losses
  if (desc.length < 100) return Number.NEGATIVE_INFINITY;
  if (/\brough (?:grid|location)\b/.test(desc) && desc.length < 220) {
    return Number.NEGATIVE_INFINITY;
  }

  // Strategic infrastructure (refineries, oil, energy, ports, airfields)
  if (/\b(refinery|oil depot|oil pumping|fuel depot|petroleum|tank farm)\b/.test(desc)) score += 6;
  if (/\b(substation|power plant|energy infrastructure|electric|grid)\b/.test(desc)) score += 5;
  if (/\b(airfield|airbase|air base|naval base|seaport|port of)\b/.test(desc)) score += 5;
  if (/\b(railway|train station|locomotive|bridge)\b/.test(desc)) score += 3;

  // Mass casualties / civilian harm
  const killedMatch = desc.match(
    /(\d+)\s+(?:were\s+)?(?:reportedly\s+)?(?:killed|dead|casualties)/,
  );
  if (killedMatch) {
    const n = Number.parseInt(killedMatch[1], 10);
    if (n >= 30) score += 8;
    else if (n >= 10) score += 5;
    else if (n >= 5) score += 3;
    else if (n >= 2) score += 1;
  }
  if (/\b(civilian|civilians)\b/.test(desc) && /(killed|wounded|injured|died)/.test(desc)) {
    score += 3;
  }
  if (/\b(massacre|mass grave|war crime)\b/.test(desc)) score += 6;

  // Long-range / strategic weapons
  if (/\b(iskander|kinzhal|atacms|storm shadow|tomahawk|kalibr|kh-\d+|tochka)\b/.test(desc)) {
    score += 4;
  }
  if (/\b(ballistic missile|cruise missile)\b/.test(desc)) score += 3;
  // Mass aerial attacks (multiple Shahed / drone barrages on cities)
  if (/\b\d+\s+(?:shahed|drones?)\b/.test(desc) && /\b(\d+)\s+(?:shahed|drone)/.test(desc)) {
    const n = Number.parseInt(desc.match(/\b(\d+)\s+(?:shahed|drones?)/)?.[1] || "0", 10);
    if (n >= 50) score += 5;
    else if (n >= 20) score += 3;
    else if (n >= 10) score += 1;
  }

  // High-value platform losses
  if (/\b(s-\d{3}|pantsir|buk|tor[- ]m|tos-1)\b/.test(desc)) score += 5; // air defense
  if (/\b(su-\d+|mig-\d+|mi-\d+|tu-\d+|ka-\d+|a-50|il-\d+|aircraft carrier)\b/.test(desc))
    score += 5;
  if (/\b(landing ship|warship|frigate|corvette|submarine|naval (?:ship|vessel))\b/.test(desc)) {
    score += 5;
  }
  if (/\b(t-\d+|t-90|t-80|tank battalion|armored column)\b/.test(desc)) score += 2;

  // Cross-border / on Russian territory
  if (
    /\b(belgorod|kursk|bryansk|voronezh|krasnodar|rostov|moscow|saint petersburg|st\.? petersburg|tatarstan|tula|ryazan)\b/.test(
      desc,
    )
  ) {
    score += 3;
  }
  if (/\b(deep strike|behind enemy lines|inside russia|russian territory)\b/.test(desc)) score += 4;

  // Strategic events
  if (
    /\b(captured|liberated|withdrew|withdrawn|retreated|advance into|broke through)\b/.test(desc)
  ) {
    score += 3;
  }
  if (/\b(commander|general|colonel|brigade commander) (?:was )?killed\b/.test(desc)) score += 5;

  // Faction signal — civilian-tagged events are usually strikes ON civilians
  if (e.faction === "Ukraine Civilian" || e.faction === "Russia Civilian") score += 2;

  return score;
}

interface GeoConfirmedFilterOptions {
  startDate: string; // YYYYMMDD inclusive
  endDate: string; // YYYYMMDD inclusive
  perMonthCap: number;
  minScore: number;
}

export function selectGeoConfirmedEvents(
  raw: GeoConfirmedEvent[],
  opts: GeoConfirmedFilterOptions,
): WarEvent[] {
  // Group by YYYYMM, score, dedupe near-duplicates, take top N per month
  const byMonth = new Map<string, Array<{ ev: GeoConfirmedEvent; score: number }>>();
  for (const ev of raw) {
    if (ev.date < opts.startDate || ev.date > opts.endDate) continue;
    const score = scoreGeoConfirmedEvent(ev);
    if (score < opts.minScore) continue;
    const key = ev.date.slice(0, 6);
    const bucket = byMonth.get(key) || [];
    bucket.push({ ev, score });
    byMonth.set(key, bucket);
  }

  const out: WarEvent[] = [];
  for (const bucket of byMonth.values()) {
    bucket.sort((a, b) => b.score - a.score || a.ev.date.localeCompare(b.ev.date));
    // Intra-month dedup: skip events whose first 60 chars of cleaned label
    // overlap with one we've already kept, or whose coords are within ~5km
    // on the same day. GeoConfirmed often files multiple verification angles
    // of the same incident.
    const kept: GeoConfirmedEvent[] = [];
    for (const { ev } of bucket) {
      const clean = ev.description.toLowerCase().slice(0, 80);
      const isDup = kept.some((k) => {
        const kClean = k.description.toLowerCase().slice(0, 80);
        if (clean === kClean) return true;
        if (k.date === ev.date) {
          const dKm = haversineKm(k.latitude, k.longitude, ev.latitude, ev.longitude);
          if (
            dKm < 5 &&
            (clean.includes(kClean.slice(0, 30)) || kClean.includes(clean.slice(0, 30)))
          ) {
            return true;
          }
        }
        return false;
      });
      if (isDup) continue;
      kept.push(ev);
      if (kept.length >= opts.perMonthCap) break;
    }
    for (const ev of kept) out.push(geoConfirmedToWarEvent(ev));
  }
  return out;
}

function geoConfirmedToWarEvent(ev: GeoConfirmedEvent): WarEvent {
  const desc = ev.description;
  // Build a concise label from the first sentence/clause
  let label = desc
    .replace(/^\d+:\d+[-–]\d*:?\d*\s*[-–—]\s*/, "") // strip leading "0:48-end -"
    .replace(/\s*Source\(s\):.*$/i, "")
    .replace(/\s*Geolocation\(s\):.*$/i, "")
    .replace(/\s*More information.*$/i, "")
    .trim();
  // Take first sentence (up to 120 chars)
  const sentenceEnd = label.search(/[.!?](?:\s|$)/);
  if (sentenceEnd > 20 && sentenceEnd < 140) label = label.slice(0, sentenceEnd);
  if (label.length > 140) label = `${label.slice(0, 137)}...`;
  if (!label) label = "GeoConfirmed event";

  const cleanDesc = desc.length > 280 ? `${desc.slice(0, 277)}...` : desc;

  return {
    date: ev.date,
    label,
    description: cleanDesc,
    lat: Math.round(ev.latitude * 100000) / 100000,
    lng: Math.round(ev.longitude * 100000) / 100000,
  };
}

async function main() {
  const token = await getAcledToken();

  // 1. Build ACLED map GeoJSON
  console.log("Building ACLED map snapshot...");
  const acledMap = await buildAcledMap(token);
  const acledPath = join(process.cwd(), "public", "data", "acled-map.json");
  const acledJson = JSON.stringify(acledMap);
  writeFileSync(acledPath, acledJson);
  const acledSizeMB = (acledJson.length / 1024 / 1024).toFixed(1);
  console.log(
    `  → public/data/acled-map.json (${acledSizeMB} MB, ${acledMap.features.length} features)\n`,
  );

  // 2. Build merged events
  console.log("Building events snapshot...");

  // Import seed data dynamically (ESM with path aliases won't work, so import the route's logic)
  const { SEED_EVENTS } = await import("../src/data/events-seed");
  const { KEY_EVENTS } = await import("../src/data/events");
  const { MISSILE_ATTACKS } = await import("../src/data/missile-attacks");

  const [wikidataEvents, acledKeyEvents] = await Promise.all([
    fetchWikidataEvents(),
    fetchAcledKeyEvents(token),
  ]);

  // Missile attack events (massive only)
  const missileEvents: WarEvent[] = MISSILE_ATTACKS.filter(
    (a: { type: string }) => a.type === "massive",
  ).map(
    (attack: {
      date: string;
      missiles: { launched: number; intercepted: number };
      drones: { launched: number; intercepted: number };
      description: string;
      targets: string[];
    }) => {
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
    },
  );

  // Fetch ACLED remote violence (missile attacks after seed cutoff)
  const { ATTACK_STATS } = await import("../src/data/missile-attacks");
  const lastSeedDate = ATTACK_STATS.latestAttack;
  const startYear = Number.parseInt(lastSeedDate.slice(0, 4), 10);
  const startMonth = Number.parseInt(lastSeedDate.slice(4, 6), 10);
  const startDay = Number.parseInt(lastSeedDate.slice(6, 8), 10);
  const missileStartDate = new Date(startYear, startMonth - 1, startDay + 1);
  const missileStartStr = missileStartDate.toISOString().slice(0, 10);
  const endStr = new Date().toISOString().slice(0, 10);

  const acledMissileEvents: WarEvent[] = [];
  if (missileStartStr < endStr) {
    console.log(`  Fetching ACLED missile/remote violence (${missileStartStr} to ${endStr})...`);
    const allFields =
      "event_id_cnty|event_date|event_type|sub_event_type|actor1|actor2|location|latitude|longitude|fatalities|notes|admin1";
    const remoteViolence = await fetchAcledPaginated(
      token,
      missileStartStr,
      endStr,
      { event_type: "Explosions/Remote violence", fatalities: "3", fatalities_where: ">=" },
      allFields,
    );

    const seenIds = new Set<string>();
    for (const ev of remoteViolence) {
      if (seenIds.has(ev.event_id_cnty)) continue;
      seenIds.add(ev.event_id_cnty);
      const dateKey = ev.event_date.replace(/-/g, "");
      if (dateKey <= lastSeedDate) continue;

      const location = ev.location || ev.admin1 || "Ukraine";
      const subType = (ev.sub_event_type || "").toLowerCase();
      let label: string;
      if (subType.includes("drone") || subType.includes("suicide"))
        label = `Drone strike: ${location}`;
      else if (subType.includes("missile") || subType.includes("shelling"))
        label = `Missile/shelling strike: ${location}`;
      else if (subType.includes("air")) label = `Aerial strike: ${location}`;
      else label = `Remote strike: ${location}`;

      const fatalities = Number.parseInt(ev.fatalities, 10) || 0;
      if (fatalities >= 10) label += ` (${fatalities} killed)`;

      acledMissileEvents.push({
        date: dateKey,
        label,
        description:
          (ev.notes || "").length > 200 ? `${(ev.notes || "").slice(0, 197)}...` : ev.notes || "",
        lat: Number.parseFloat(ev.latitude),
        lng: Number.parseFloat(ev.longitude),
      });
    }
    console.log(`  ${acledMissileEvents.length} ACLED missile events`);
  }

  const merged = mergeEvents(wikidataEvents, SEED_EVENTS as WarEvent[], [
    ...acledKeyEvents,
    ...missileEvents,
    ...acledMissileEvents,
  ]);

  // 3. Fill the post-ACLED gap with GeoConfirmed (OSINT-verified events)
  // ACLED's free tier is ~12 months delayed, so anything after the cutoff
  // comes from GeoConfirmed (https://geoconfirmed.org), an open-data OSINT
  // project that verifies each event against photo/video evidence.
  const acledCutoff = new Date();
  acledCutoff.setFullYear(acledCutoff.getFullYear() - 1);
  const gapStartStr = acledCutoff.toISOString().slice(0, 10).replace(/-/g, "");
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  console.log(`  Fetching GeoConfirmed events for gap fill (${gapStartStr}+)...`);
  let geoConfirmedSelected: WarEvent[] = [];
  try {
    const rawGc = await fetchGeoConfirmedEvents();
    geoConfirmedSelected = selectGeoConfirmedEvents(rawGc, {
      startDate: gapStartStr,
      endDate: todayStr,
      perMonthCap: 30,
      minScore: 3,
    });
    console.log(
      `  ${geoConfirmedSelected.length} GeoConfirmed events selected (top ~30/month, score >= 3)`,
    );
  } catch (err) {
    console.warn(
      `  ⚠ GeoConfirmed fetch failed (continuing without it): ${err instanceof Error ? err.message : err}`,
    );
  }

  // Merge GeoConfirmed into the existing set with the same dedup logic
  const mergedWithGc = mergeEvents([], merged, geoConfirmedSelected);

  // Apply highlight flags from KEY_EVENTS
  const highlightDates = new Set(
    (KEY_EVENTS as WarEvent[]).filter((e) => e.highlight).map((e) => e.date),
  );
  for (const event of mergedWithGc) {
    if (highlightDates.has(event.date)) event.highlight = true;
  }

  const eventsPath = join(process.cwd(), "public", "data", "events.json");
  const eventsJson = JSON.stringify(mergedWithGc);
  writeFileSync(eventsPath, eventsJson);
  const eventsSizeKB = (eventsJson.length / 1024).toFixed(0);
  console.log(`  → public/data/events.json (${eventsSizeKB} KB, ${mergedWithGc.length} events)\n`);

  console.log("Done!");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("Prebuild failed:", err);
    process.exit(1);
  });
}
