#!/usr/bin/env npx tsx

/**
 * Augments public/data/events.json with the latest GeoConfirmed events to
 * fill the post-ACLED timeline gap. Unlike scripts/prebuild-events.ts, this
 * does NOT require ACLED credentials — it loads the existing committed
 * events.json as the base and only adds GeoConfirmed events for the gap.
 *
 * Run locally:  npx tsx scripts/update-events-gc.ts
 * Run in CI:    daily via .github/workflows/update-events.yml
 *
 * Source: GeoConfirmed (https://geoconfirmed.org) — open OSINT-verified data
 * License: Open data with attribution
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fetchGeoConfirmedEvents } from "./fetch-geoconfirmed";
import { selectGeoConfirmedEvents } from "./prebuild-events";

interface WarEvent {
  date: string;
  label: string;
  description: string;
  lat?: number;
  lng?: number;
  highlight?: boolean;
  source?: string;
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

/** Same dedup logic as prebuild-events.ts mergeEvents() */
function mergeWithExisting(existing: WarEvent[], additions: WarEvent[]): WarEvent[] {
  const merged = [...existing];
  for (const event of additions) {
    const isDuplicate = merged.some((m) => {
      const eDate = Number.parseInt(event.date, 10);
      const mDate = Number.parseInt(m.date, 10);
      if (Math.abs(eDate - mDate) > 3) return false;
      const eLabel = event.label.toLowerCase();
      const mLabel = m.label.toLowerCase();
      if (eLabel.includes(mLabel) || mLabel.includes(eLabel)) return true;
      if (event.lat != null && event.lng != null && m.lat != null && m.lng != null) {
        if (haversineKm(event.lat, event.lng, m.lat, m.lng) < 50) return true;
      }
      return false;
    });
    if (!isDuplicate) merged.push(event);
  }
  return merged.sort((a, b) => a.date.localeCompare(b.date));
}

async function main() {
  const eventsPath = join(process.cwd(), "public", "data", "events.json");
  const existing: WarEvent[] = JSON.parse(readFileSync(eventsPath, "utf-8"));
  console.log(`Loaded ${existing.length} existing events from public/data/events.json`);

  // Determine the gap window. ACLED free-tier cutoff is ~12 months ago.
  const acledCutoff = new Date();
  acledCutoff.setFullYear(acledCutoff.getFullYear() - 1);
  const gapStart = acledCutoff.toISOString().slice(0, 10).replace(/-/g, "");
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  console.log(`Filling gap ${gapStart} → ${today} from GeoConfirmed...`);

  const raw = await fetchGeoConfirmedEvents();
  const selected = selectGeoConfirmedEvents(raw, {
    startDate: gapStart,
    endDate: today,
    perMonthCap: 30,
    minScore: 3,
  });
  // Tag for citation in UI
  for (const e of selected) (e as WarEvent).source = "GeoConfirmed";
  console.log(`Selected ${selected.length} GeoConfirmed events (top ~30/month)`);

  const merged = mergeWithExisting(existing, selected);
  const added = merged.length - existing.length;
  console.log(`Added ${added} new events after dedup (total: ${merged.length})`);

  writeFileSync(eventsPath, JSON.stringify(merged));
  const sizeKB = (JSON.stringify(merged).length / 1024).toFixed(0);
  console.log(`→ public/data/events.json (${sizeKB} KB, ${merged.length} events)`);

  // Print monthly distribution sanity check
  const byMonth = new Map<string, number>();
  for (const e of merged) {
    const k = e.date.slice(0, 6);
    byMonth.set(k, (byMonth.get(k) || 0) + 1);
  }
  console.log("\nRecent monthly volume:");
  for (const [k, c] of [...byMonth.entries()].sort().slice(-15)) {
    console.log(`  ${k}: ${c}`);
  }
}

main().catch((err) => {
  console.error("Update failed:", err);
  process.exit(1);
});
