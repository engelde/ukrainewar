// maplibre-gl v6 no longer inlines its web worker; bundlers must serve it
// themselves. Copy the worker (and its shared-chunk sibling) into public/ so
// setWorkerUrl("/maplibre/maplibre-gl-worker.mjs") resolves in dev and prod.
// See https://maplibre.org/maplibre-gl-js/docs/guides/v5-to-v6-migration-guide/
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const dist = path.join(
  path.dirname(createRequire(import.meta.url).resolve("maplibre-gl/package.json")),
  "dist",
);
const dest = path.join(process.cwd(), "public", "maplibre");

mkdirSync(dest, { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(path.join(dist, file), path.join(dest, file));
}
console.log(`Copied MapLibre worker files to ${dest}`);
