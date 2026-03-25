#!/usr/bin/env npx tsx
/**
 * Pre-fetches available DeepState territory dates from GitHub API.
 * Output: public/data/territory-dates.json
 *
 * Eliminates the runtime GitHub API call in /api/territory/dates.
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";

const GITHUB_API = "https://api.github.com/repos/cyterat/deepstate-map-data/contents/data";

async function main() {
  console.log("Fetching territory dates from GitHub API...");
  const res = await fetch(GITHUB_API, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "UkraineWarTracker/1.0",
    },
  });

  if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);

  const items: Array<{ name: string }> = await res.json();
  const dates: string[] = [];

  for (const item of items) {
    const match = item.name.match(/deepstatemap_data_(\d{8})\.geojson/);
    if (match) dates.push(match[1]);
  }

  dates.sort();

  const outPath = join(process.cwd(), "public", "data", "territory-dates.json");
  writeFileSync(outPath, JSON.stringify({ dates, count: dates.length }));
  console.log(`Done! ${dates.length} dates → public/data/territory-dates.json`);
}

main().catch((err) => {
  console.error("Territory dates prebuild failed:", err);
  process.exit(1);
});
