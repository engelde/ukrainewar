/**
 * UK OFSI (Office of Financial Sanctions Implementation) data fetcher.
 *
 * Fetches the consolidated sanctions list CSV and extracts Russia-regime
 * designations to supplement the static sanctions dataset with live data.
 *
 * Source: https://www.gov.uk/government/publications/the-uk-sanctions-list
 */

import type { SanctionsPackage } from "@/data/sanctions";

const OFSI_CSV_URL = "https://ofsistorage.blob.core.windows.net/publishlive/2022format/ConList.csv";

const FETCH_TIMEOUT_MS = 20_000;

// Column indices in the OFSI CSV header (0-based)
const COL = {
  GROUP_TYPE: 28,
  REGIME: 31,
  LISTED_ON: 32,
  GROUP_ID: 35,
} as const;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Parse a single CSV line that may contain quoted fields with embedded commas.
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

/**
 * Convert DD/MM/YYYY to YYYYMMDD.
 */
function toYYYYMMDD(dmy: string): string | null {
  const m = dmy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}${m[2]}${m[1]}`;
}

/**
 * Convert DD/MM/YYYY to YYYYMM for monthly grouping.
 */
function toYYYYMM(dmy: string): string | null {
  const m = dmy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}${m[2]}`;
}

interface OFSIResult {
  /** New SanctionsPackage entries for dates after the static data cutoff. */
  packages: SanctionsPackage[];
  /** Total unique individuals sanctioned under the Russia regime. */
  totalIndividuals: number;
  /** Total unique entities sanctioned under the Russia regime. */
  totalEntities: number;
  /** Last-updated date from the OFSI file header. */
  listUpdated: string;
}

/**
 * Fetch the UK OFSI consolidated sanctions list and extract Russia-regime
 * designations grouped by month, producing SanctionsPackage entries for
 * any months after `cutoffYYYYMM`.
 */
export async function fetchOFSISanctions(cutoffYYYYMM: string): Promise<OFSIResult> {
  const res = await fetch(OFSI_CSV_URL, {
    headers: { Accept: "text/csv" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`OFSI fetch failed: ${res.status}`);
  }

  const csv = await res.text();
  const lines = csv.split("\n");

  if (lines.length < 3) {
    throw new Error("Invalid OFSI CSV: too few lines");
  }

  // Line 0: "Last Updated,DD/MM/YYYY"
  const listUpdated = lines[0].split(",")[1]?.trim() ?? "unknown";

  // Track unique Group IDs (the same entity can have multiple alias rows)
  const allIndividuals = new Set<string>();
  const allEntities = new Set<string>();

  // Group new designations by month
  const byMonth = new Map<
    string,
    { individuals: Set<string>; entities: Set<string>; earliestDate: string }
  >();

  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const fields = parseCSVLine(line);
    const regime = fields[COL.REGIME]?.trim() ?? "";

    if (regime !== "Russia") continue;

    const groupType = fields[COL.GROUP_TYPE]?.trim() ?? "";
    const listedOn = fields[COL.LISTED_ON]?.trim() ?? "";
    const groupId = fields[COL.GROUP_ID]?.trim().replace(/\r$/, "") ?? "";

    if (!groupId) continue;

    // Track totals
    if (groupType === "Individual") allIndividuals.add(groupId);
    else if (groupType === "Entity") allEntities.add(groupId);

    // Group new entries by month
    const ym = toYYYYMM(listedOn);
    if (!ym || ym <= cutoffYYYYMM) continue;

    if (!byMonth.has(ym)) {
      byMonth.set(ym, {
        individuals: new Set(),
        entities: new Set(),
        earliestDate: toYYYYMMDD(listedOn) ?? `${ym}01`,
      });
    }
    const bucket = byMonth.get(ym)!;
    if (groupType === "Individual") bucket.individuals.add(groupId);
    else if (groupType === "Entity") bucket.entities.add(groupId);

    // Track earliest date in the month for the package date
    const yyyymmdd = toYYYYMMDD(listedOn);
    if (yyyymmdd && yyyymmdd < bucket.earliestDate) {
      bucket.earliestDate = yyyymmdd;
    }
  }

  // Build SanctionsPackage entries from new monthly buckets
  const packages: SanctionsPackage[] = [];
  const sortedMonths = [...byMonth.keys()].sort();

  for (const ym of sortedMonths) {
    const data = byMonth.get(ym)!;
    const indCount = data.individuals.size;
    const entCount = data.entities.size;
    if (indCount === 0 && entCount === 0) continue;

    const year = ym.substring(0, 4);
    const monthIdx = Number.parseInt(ym.substring(4, 6), 10) - 1;
    const monthName = MONTH_NAMES[monthIdx] ?? ym.substring(4, 6);
    const total = indCount + entCount;

    packages.push({
      id: `uk-ofsi-${ym}`,
      date: data.earliestDate,
      imposedBy: "UK",
      packageName: `UK Russia Sanctions – ${monthName} ${year}`,
      description:
        `UK OFSI designations under the Russia sanctions regime in ${monthName} ${year}. ` +
        `${indCount} individual${indCount !== 1 ? "s" : ""} and ` +
        `${entCount} entit${entCount !== 1 ? "ies" : "y"} designated.`,
      targets: { individuals: indCount, entities: entCount },
      keyMeasures: [
        `Asset freezes on ${total} new designation${total !== 1 ? "s" : ""}`,
        "Travel bans on designated individuals",
        "Restrictions on providing funds or economic resources",
      ],
      source: "https://www.gov.uk/government/publications/the-uk-sanctions-list",
    });
  }

  return {
    packages,
    totalIndividuals: allIndividuals.size,
    totalEntities: allEntities.size,
    listUpdated,
  };
}
