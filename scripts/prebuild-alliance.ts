#!/usr/bin/env npx tsx
/**
 * Pre-filters the 19MB world GeoJSON to only countries with known alignments.
 * Output: public/data/alliance.json (~500KB)
 *
 * Eliminates the runtime 19MB fetch in the /api/alliance endpoint.
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { INTERNATIONAL_SUPPORT } from "../src/data/international-support";

const WORLD_GEOJSON_URL =
  "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";

const NAME_TO_ISO2: Record<string, string> = {
  France: "FR",
  Norway: "NO",
};

async function main() {
  console.log("Fetching world GeoJSON (19MB)...");
  const res = await fetch(WORLD_GEOJSON_URL);
  if (!res.ok) throw new Error(`Failed to fetch world GeoJSON: ${res.status}`);
  const world = (await res.json()) as GeoJSON.FeatureCollection;
  console.log(`  ${world.features.length} countries loaded`);

  const ukraineCodes = new Set(
    INTERNATIONAL_SUPPORT.filter((c) => c.side === "ukraine").map((c) => c.countryCode),
  );
  const russiaCodes = new Set(
    INTERNATIONAL_SUPPORT.filter((c) => c.side === "russia").map((c) => c.countryCode),
  );

  const features: GeoJSON.Feature[] = [];

  for (const feature of world.features) {
    let iso2 = (feature.properties?.["ISO3166-1-Alpha-2"] ?? "") as string;
    if (!iso2 || iso2 === "-99") {
      const name = (feature.properties?.name ?? "") as string;
      iso2 = NAME_TO_ISO2[name] ?? "";
    }
    if (!iso2) continue;
    if (iso2 === "UA" || iso2 === "RU") continue;

    let side: string | null = null;
    if (ukraineCodes.has(iso2)) side = "ukraine";
    else if (russiaCodes.has(iso2)) side = "russia";

    if (side) {
      features.push({
        ...feature,
        properties: { ...feature.properties, side, iso2 },
      });
    }
  }

  const result: GeoJSON.FeatureCollection = { type: "FeatureCollection", features };
  const json = JSON.stringify(result);
  const outPath = join(process.cwd(), "public", "data", "alliance.json");
  writeFileSync(outPath, json);

  const sizeMB = (json.length / 1024 / 1024).toFixed(1);
  console.log(
    `Done! ${features.length} aligned countries → public/data/alliance.json (${sizeMB} MB)`,
  );
}

main().catch((err) => {
  console.error("Alliance prebuild failed:", err);
  process.exit(1);
});
