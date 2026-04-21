#!/usr/bin/env npx tsx

/**
 * Fetches OSINT-verified war events from GeoConfirmed (geoconfirmed.org).
 *
 * GeoConfirmed is a community-sourced database of geolocated conflict events.
 * Each placemark is independently verified against photo or video evidence
 * before being published. The dataset is updated continuously and freely
 * available for research, journalism, and analytical use under their
 * open-data terms (with attribution).
 *
 * We use it to fill the post-ACLED gap in our event timeline. ACLED's
 * free tier is ~12 months delayed, so we use GeoConfirmed for events
 * after the ACLED cutoff to keep the timeline current.
 *
 * Source: https://geoconfirmed.org/scalar/v1
 * License: Open data with attribution
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const GEOCONFIRMED_KMZ_URL = "https://geoconfirmed.org/api/Map/export/Ukraine";
const CACHE_DIR = join(process.cwd(), ".cache");
const CACHE_KMZ = join(CACHE_DIR, "geoconfirmed-ukraine.kmz");
const CACHE_KML = join(CACHE_DIR, "geoconfirmed-ukraine.kml");
// Refresh KMZ if cache is older than this (ms)
const CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6 hours

export interface GeoConfirmedEvent {
  id: string;
  date: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  faction?: string;
  iconType?: string;
  sourceUrl?: string;
}

async function downloadKmz(): Promise<void> {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });

  if (existsSync(CACHE_KMZ)) {
    const stats = await import("node:fs").then((fs) => fs.promises.stat(CACHE_KMZ));
    const age = Date.now() - stats.mtimeMs;
    if (age < CACHE_MAX_AGE_MS) {
      console.log(`  Using cached KMZ (${(age / 1000 / 60).toFixed(0)} min old)`);
      return;
    }
  }

  console.log(`  Downloading GeoConfirmed Ukraine KMZ...`);
  const res = await fetch(GEOCONFIRMED_KMZ_URL, {
    headers: { "User-Agent": "UkraineWarTracker/1.0 (https://ukrainewar.app)" },
  });
  if (!res.ok) throw new Error(`GeoConfirmed download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(CACHE_KMZ, buf);
  console.log(`  Downloaded ${(buf.length / 1024 / 1024).toFixed(1)} MB`);
}

function extractKml(): string {
  // KMZ is a ZIP archive containing doc.kml. Use system `unzip` to avoid a
  // dependency — it's available on macOS, Linux, and GitHub Actions runners.
  console.log(`  Extracting doc.kml...`);
  execFileSync("unzip", ["-o", "-q", CACHE_KMZ, "doc.kml", "-d", CACHE_DIR]);
  const kml = readFileSync(join(CACHE_DIR, "doc.kml"), "utf-8");
  writeFileSync(CACHE_KML, kml);
  return kml;
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

/** Extract content from a tag that may be wrapped in CDATA. */
function tagContent(block: string, tag: string): string | null {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`);
  const m = block.match(re);
  if (!m) return null;
  const raw = m[1];
  const cdata = raw.match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
  return cdata ? cdata[1] : decodeXmlEntities(raw);
}

const MONTHS: Record<string, string> = {
  JAN: "01",
  FEB: "02",
  MAR: "03",
  APR: "04",
  MAY: "05",
  JUN: "06",
  JUL: "07",
  AUG: "08",
  SEP: "09",
  OCT: "10",
  NOV: "11",
  DEC: "12",
};

/** Parse "20 APR 2026" -> "20260420". Returns null if unparseable. */
function parseDateName(name: string): string | null {
  const m = name.match(/^(\d{1,2})\s+([A-Z]{3})\s+(\d{4})/i);
  if (!m) return null;
  const day = m[1].padStart(2, "0");
  const month = MONTHS[m[2].toUpperCase()];
  const year = m[3];
  if (!month) return null;
  return `${year}${month}${day}`;
}

function stripHtml(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstUrl(s: string): string | undefined {
  const m = s.match(/https?:\/\/[^\s<")\]]+/);
  return m ? m[0] : undefined;
}

/**
 * Faction is encoded in styleUrl color hex:
 *   0051CA = Ukraine, E00000 = Russia, 400080 = Belarus, 6A1D00 = North Korea,
 *   DDDD00 = Special, 0A5900 = NATO, AC7339 = Neutral, 666666 = Unknown,
 *   3184FF = Ukraine Civilian, FF6666 = Russia Civilian, 65BB59 = NATO Civilian
 */
const FACTION_COLORS: Record<string, string> = {
  "0051CA": "Ukraine",
  "3184FF": "Ukraine Civilian",
  E00000: "Russia",
  FF6666: "Russia Civilian",
  "6A1D00": "North Korea",
  "400080": "Belarus",
  DDDD00: "Special",
  "0A5900": "NATO",
  "65BB59": "NATO Civilian",
  AC7339: "Neutral",
  "666666": "Unknown",
};

function parseStyleUrl(styleUrl: string | null): { faction?: string; iconType?: string } {
  if (!styleUrl) return {};
  // styleUrl: "#api/icons/E00000/False/icons/Ukraine/radar_4.png"
  // or "#api/icons/0051CA/False/template/91.png"
  const colorMatch = styleUrl.match(/icons\/([0-9A-Fa-f]{6})\//);
  const iconMatch = styleUrl.match(/\/([^/]+)\.png/);
  const faction = colorMatch ? FACTION_COLORS[colorMatch[1].toUpperCase()] : undefined;
  const iconType = iconMatch ? iconMatch[1] : undefined;
  return { faction, iconType };
}

/**
 * Parse Placemark blocks from the KML. We use regex rather than a full XML
 * parser to avoid adding a dependency — the KML is well-structured and the
 * Placemark format is consistent.
 *
 * GeoConfirmed KML layout: each Placemark has a CDATA-wrapped `<name>` containing
 * the date as "DD MON YYYY", a CDATA `<description>` with the narrative + source
 * links, a `<styleUrl>` encoding faction (color) + icon type, and a
 * `<Point><coordinates>lng,lat,0</coordinates>`. There are no `<TimeStamp>`
 * elements — folders are time-bucket groupings (Last 7 days, etc.) only.
 */
function parsePlacemarks(kml: string): GeoConfirmedEvent[] {
  const events: GeoConfirmedEvent[] = [];
  const placemarkRe = /<Placemark>([\s\S]*?)<\/Placemark>/g;
  // Dedupe — sometimes the same event appears in multiple folder views
  const seen = new Set<string>();

  let m: RegExpExecArray | null;
  let idx = 0;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex iteration
  while ((m = placemarkRe.exec(kml)) !== null) {
    const block = m[1];
    const name = tagContent(block, "name");
    const description = tagContent(block, "description");
    const styleUrl = tagContent(block, "styleUrl");
    const coordsRaw = tagContent(block, "coordinates");
    if (!name || !coordsRaw) continue;

    const coords = coordsRaw.trim().split(",");
    const lng = Number.parseFloat(coords[0]);
    const lat = Number.parseFloat(coords[1]);
    if (Number.isNaN(lat) || Number.isNaN(lng) || (lat === 0 && lng === 0)) continue;

    const date = parseDateName(name.trim());
    if (!date) continue;

    const dedupeKey = `${date}|${lat.toFixed(4)}|${lng.toFixed(4)}|${(description || "").slice(0, 80)}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const desc = stripHtml(description || "");
    const sourceUrl = firstUrl(description || "");
    const { faction, iconType } = parseStyleUrl(styleUrl);

    events.push({
      id: `gc-${idx++}`,
      date,
      name: name.trim(),
      description: desc,
      latitude: lat,
      longitude: lng,
      faction,
      iconType,
      sourceUrl,
    });
  }

  return events;
}

export async function fetchGeoConfirmedEvents(): Promise<GeoConfirmedEvent[]> {
  await downloadKmz();
  const kml = extractKml();
  const events = parsePlacemarks(kml);
  console.log(`  Parsed ${events.length} GeoConfirmed placemarks`);
  return events;
}

// Allow standalone execution: `npx tsx scripts/fetch-geoconfirmed.ts`
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchGeoConfirmedEvents()
    .then((events) => {
      const out = join(process.cwd(), ".cache", "geoconfirmed-events.json");
      writeFileSync(out, JSON.stringify(events, null, 2));
      console.log(`Wrote ${events.length} events → ${out}`);
      // Print a monthly distribution sanity check
      const byMonth = new Map<string, number>();
      for (const e of events) {
        const k = e.date.slice(0, 6);
        byMonth.set(k, (byMonth.get(k) || 0) + 1);
      }
      const recent = Array.from(byMonth.entries()).sort().slice(-12);
      console.log("\nRecent months:");
      for (const [k, c] of recent) console.log(`  ${k}: ${c}`);
    })
    .catch((err) => {
      console.error("Failed:", err);
      process.exit(1);
    });
}
