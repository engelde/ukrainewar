#!/usr/bin/env node

/**
 * Downloads and processes ACLED HDX Ukraine conflict data XLSX files
 * into a compact JSON file for the frontend.
 *
 * Output: public/data/acled-regional.json
 *
 * Run: node scripts/process-acled-hdx.mjs
 */

import ExcelJS from "exceljs";
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, "..", "public", "data", "acled-regional.json");

const HDX_DATASETS = {
  politicalViolence: {
    url: "https://data.humdata.org/dataset/7b36830b-c033-4a06-b812-9940baec603b/resource/e122ca1c-9463-4e3a-8731-8a85fab2a15e/download/ukraine_hrp_political_violence_events_and_fatalities_by_month-year_as-of-11mar2026.xlsx",
    label: "Political Violence",
  },
  civilianTargeting: {
    url: "https://data.humdata.org/dataset/7b36830b-c033-4a06-b812-9940baec603b/resource/23755ad0-1d81-4b10-9e66-23b784ccd429/download/ukraine_hrp_civilian_targeting_events_and_fatalities_by_month-year_as-of-11mar2026.xlsx",
    label: "Civilian Targeting",
  },
  demonstrations: {
    url: "https://data.humdata.org/dataset/7b36830b-c033-4a06-b812-9940baec603b/resource/0f040d73-471e-4535-bef1-59ac09faa63c/download/ukraine_hrp_demonstration_events_by_month-year_as-of-11mar2026.xlsx",
    label: "Demonstrations",
  },
};

const MONTH_TO_NUM = {
  January: "01",
  February: "02",
  March: "03",
  April: "04",
  May: "05",
  June: "06",
  July: "07",
  August: "08",
  September: "09",
  October: "10",
  November: "11",
  December: "12",
};

/** Read an XLSX buffer and return rows as objects keyed by header names. */
async function readXlsxSheet(buf) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.getWorksheet("Data") || wb.worksheets[0];
  const headers = [];
  const rows = [];
  ws.eachRow((row, idx) => {
    const vals = row.values.slice(1); // ExcelJS row.values is 1-indexed
    if (idx === 1) {
      for (const v of vals) headers.push(v);
      return;
    }
    const obj = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = vals[i] ?? null;
    }
    rows.push(obj);
  });
  return rows;
}

async function downloadXLSX(url) {
  console.log(`  Downloading ${url.split("/").pop().slice(0, 60)}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return readXlsxSheet(buf);
}

async function main() {
  console.log("Downloading ACLED HDX datasets...");

  const pvData = await downloadXLSX(HDX_DATASETS.politicalViolence.url);
  const ctData = await downloadXLSX(HDX_DATASETS.civilianTargeting.url);
  const demoData = await downloadXLSX(HDX_DATASETS.demonstrations.url);

  // Process into structured format by oblast and month
  const oblasts = {};
  const monthlyTotals = {};
  const yearlyTotals = {};

  function processRows(rows, category) {
    for (const row of rows) {
      const oblast = row.Admin1;
      const month = MONTH_TO_NUM[row.Month];
      const year = String(row.Year);
      if (!oblast || !month || !year) continue;

      const key = `${year}-${month}`;
      const events = row.Events || 0;
      const fatalities = row.Fatalities || 0;

      // By oblast
      if (!oblasts[oblast]) oblasts[oblast] = { pcode: row["Admin1 Pcode"] || "", months: {} };
      if (!oblasts[oblast].months[key]) {
        oblasts[oblast].months[key] = { events: 0, fatalities: 0, civilian: 0, demos: 0 };
      }
      if (category === "pv") {
        oblasts[oblast].months[key].events += events;
        oblasts[oblast].months[key].fatalities += fatalities;
      } else if (category === "ct") {
        oblasts[oblast].months[key].civilian += events;
      } else if (category === "demo") {
        oblasts[oblast].months[key].demos += events;
      }

      // Monthly totals
      if (!monthlyTotals[key]) {
        monthlyTotals[key] = { events: 0, fatalities: 0, civilian: 0, demos: 0 };
      }
      if (category === "pv") {
        monthlyTotals[key].events += events;
        monthlyTotals[key].fatalities += fatalities;
      } else if (category === "ct") {
        monthlyTotals[key].civilian += events;
      } else if (category === "demo") {
        monthlyTotals[key].demos += events;
      }

      // Yearly totals
      if (!yearlyTotals[year]) {
        yearlyTotals[year] = { events: 0, fatalities: 0, civilian: 0, demos: 0 };
      }
      if (category === "pv") {
        yearlyTotals[year].events += events;
        yearlyTotals[year].fatalities += fatalities;
      } else if (category === "ct") {
        yearlyTotals[year].civilian += events;
      } else if (category === "demo") {
        yearlyTotals[year].demos += events;
      }
    }
  }

  processRows(pvData, "pv");
  processRows(ctData, "ct");
  processRows(demoData, "demo");

  // Sort months and compute oblast totals (2022+)
  const oblastSummaries = Object.entries(oblasts)
    .map(([name, data]) => {
      let totalEvents = 0,
        totalFatalities = 0,
        totalCivilian = 0;
      for (const [key, m] of Object.entries(data.months)) {
        if (key >= "2022") {
          totalEvents += m.events;
          totalFatalities += m.fatalities;
          totalCivilian += m.civilian;
        }
      }
      return {
        name,
        pcode: data.pcode,
        totalEvents,
        totalFatalities,
        totalCivilian,
      };
    })
    .sort((a, b) => b.totalEvents - a.totalEvents);

  // Monthly timeline (sorted)
  const timeline = Object.entries(monthlyTotals)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));

  // Cumulative fatalities over time (2022+)
  let cumFatalities = 0;
  const cumulativeFatalities = timeline
    .filter((t) => t.date >= "2022-02")
    .map((t) => {
      cumFatalities += t.fatalities;
      return { date: t.date, fatalities: cumFatalities };
    });

  const output = {
    lastUpdated: new Date().toISOString().split("T")[0],
    oblasts: oblastSummaries,
    oblastMonthly: Object.fromEntries(
      Object.entries(oblasts).map(([name, data]) => [
        name,
        {
          pcode: data.pcode,
          months: Object.entries(data.months)
            .sort(([a], [b]) => a.localeCompare(b))
            .filter(([key]) => key >= "2022")
            .map(([date, d]) => ({ date, ...d })),
        },
      ]),
    ),
    timeline,
    yearlyTotals: Object.entries(yearlyTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, data]) => ({ year, ...data })),
    cumulativeFatalities,
    source: {
      name: "ACLED via HDX",
      url: "https://data.humdata.org/dataset/ukraine-acled-conflict-data",
      attribution: "ACLED (Armed Conflict Location & Event Data Project). Licensed under CC-BY.",
    },
  };

  writeFileSync(OUTPUT, JSON.stringify(output));
  const sizeKB = (JSON.stringify(output).length / 1024).toFixed(1);
  console.log(`Written ${OUTPUT} (${sizeKB} KB)`);
  console.log(`  ${oblastSummaries.length} oblasts, ${timeline.length} months`);
  console.log(
    `  Top oblast: ${oblastSummaries[0].name} (${oblastSummaries[0].totalEvents.toLocaleString()} events)`,
  );
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
