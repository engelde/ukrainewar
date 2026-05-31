#!/usr/bin/env npx tsx
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { validateSpendingData } from "../src/lib/spending-data";

const dataPath = process.argv[2] ?? join(process.cwd(), "public", "data", "kiel-spending.json");
const data = JSON.parse(readFileSync(dataPath, "utf8"));
const result = validateSpendingData(data);

if (!result.valid) {
  console.error(`Invalid Kiel spending data in ${dataPath}:`);
  for (const error of result.errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Kiel spending data valid: ${dataPath}`);
