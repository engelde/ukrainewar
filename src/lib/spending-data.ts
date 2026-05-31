export interface SpendingTotals {
  military: number;
  financial: number;
  humanitarian: number;
  total: number;
}

export interface SpendingCountry extends SpendingTotals {
  country: string;
  euMember: boolean;
}

export interface SpendingMonth extends SpendingTotals {
  date: string;
}

export interface WeaponCategory {
  name: string;
  valueEUR: number;
  records: number;
}

export interface NotableWeapon {
  name: string;
  valueEUR: number;
  delivered: number;
  pledged: number;
  donors: string[];
}

export interface SpendingCountryCumulative {
  date: string;
  countries: SpendingCountry[];
}

export interface SpendingData {
  lastUpdated: string;
  release: number;
  currency: string;
  unit: string;
  donors: number;
  totals: SpendingTotals;
  byCountry: SpendingCountry[];
  byMonth: SpendingMonth[];
  cumulative: SpendingMonth[];
  byCountryCumulative?: SpendingCountryCumulative[];
  topWeapons: { name: string; count: number }[];
  weaponsByCategory?: WeaponCategory[];
  notableWeapons?: NotableWeapon[];
  weaponsByDonor?: {
    donor: string;
    totalEUR: number;
    categories: { name: string; valueEUR: number }[];
  }[];
  source: { name: string; url: string; release: string };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface SpendingSnapshot {
  totals: SpendingTotals;
  byCountry: SpendingCountry[];
  byMonth: SpendingMonth[];
  donorCount: number;
  isTimelineScoped: boolean;
  month: string | null;
}

const WAR_START_DATE = "20220224";
const WAR_START_MONTH = "2022-02";
const MIN_VALID_DONORS = 10;
const MIN_VALID_MONTHS = 12;
const MIN_VALID_TOTAL_BILLION_EUR = 50;

export const ZERO_SPENDING_TOTALS: SpendingTotals = {
  military: 0,
  financial: 0,
  humanitarian: 0,
  total: 0,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function asRecordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function hasValidTotals(value: unknown): value is SpendingTotals {
  if (!isRecord(value)) return false;
  return (
    isFiniteNumber(value.military) &&
    isFiniteNumber(value.financial) &&
    isFiniteNumber(value.humanitarian) &&
    isFiniteNumber(value.total)
  );
}

function isMonthKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}$/.test(value);
}

function pushIf(condition: boolean, errors: string[], message: string) {
  if (condition) errors.push(message);
}

export function validateSpendingData(value: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return { valid: false, errors: ["payload is not an object"] };
  }

  pushIf(!isFiniteNumber(value.release) || value.release <= 0, errors, "release is missing");
  pushIf(typeof value.lastUpdated !== "string", errors, "lastUpdated is missing");
  pushIf(value.currency !== "EUR", errors, "currency must be EUR");
  pushIf(value.unit !== "billions", errors, "unit must be billions");

  if (!hasValidTotals(value.totals)) {
    errors.push("totals are missing or non-numeric");
  } else {
    pushIf(
      value.totals.total < MIN_VALID_TOTAL_BILLION_EUR,
      errors,
      `total aid is implausibly low: €${value.totals.total}B`,
    );
    pushIf(value.totals.military <= 0, errors, "military total is zero");
    pushIf(value.totals.financial <= 0, errors, "financial total is zero");
    pushIf(value.totals.humanitarian <= 0, errors, "humanitarian total is zero");
  }

  const byCountry = asRecordArray(value.byCountry);
  pushIf(byCountry.length < MIN_VALID_DONORS, errors, "byCountry has too few donors");
  pushIf(
    !isFiniteNumber(value.donors) || value.donors < MIN_VALID_DONORS,
    errors,
    "donor count is implausibly low",
  );
  for (const [index, country] of byCountry.entries()) {
    pushIf(
      typeof country.country !== "string" || !country.country,
      errors,
      `country ${index} has no name`,
    );
    pushIf(
      !hasValidTotals(country),
      errors,
      `country ${country.country ?? index} has invalid totals`,
    );
  }

  const byMonth = asRecordArray(value.byMonth);
  const cumulative = asRecordArray(value.cumulative);
  pushIf(byMonth.length < MIN_VALID_MONTHS, errors, "byMonth has too few records");
  pushIf(cumulative.length < MIN_VALID_MONTHS, errors, "cumulative has too few records");
  pushIf(
    byMonth.length !== cumulative.length,
    errors,
    `byMonth/cumulative length mismatch: ${byMonth.length}/${cumulative.length}`,
  );

  let previousMonth = "";
  for (const [index, month] of byMonth.entries()) {
    pushIf(!isMonthKey(month.date), errors, `byMonth ${index} has invalid date`);
    pushIf(
      previousMonth !== "" && String(month.date) <= previousMonth,
      errors,
      "byMonth is not sorted",
    );
    pushIf(!hasValidTotals(month), errors, `byMonth ${month.date ?? index} has invalid totals`);
    previousMonth = String(month.date ?? previousMonth);
  }

  let previousCumulativeMonth = "";
  let previousTotal = 0;
  for (const [index, month] of cumulative.entries()) {
    pushIf(!isMonthKey(month.date), errors, `cumulative ${index} has invalid date`);
    pushIf(
      previousCumulativeMonth !== "" && String(month.date) <= previousCumulativeMonth,
      errors,
      "cumulative is not sorted",
    );
    if (!hasValidTotals(month)) {
      errors.push(`cumulative ${month.date ?? index} has invalid totals`);
    } else {
      pushIf(month.total < previousTotal, errors, "cumulative totals decrease over time");
      previousTotal = month.total;
    }
    previousCumulativeMonth = String(month.date ?? previousCumulativeMonth);
  }
  pushIf(
    previousTotal < MIN_VALID_TOTAL_BILLION_EUR,
    errors,
    `latest cumulative total is implausibly low: €${previousTotal}B`,
  );

  const byCountryCumulative = asRecordArray(value.byCountryCumulative);
  pushIf(
    byCountryCumulative.length !== cumulative.length,
    errors,
    "byCountryCumulative must exist and align with cumulative months",
  );
  for (const [index, entry] of byCountryCumulative.entries()) {
    pushIf(!isMonthKey(entry.date), errors, `byCountryCumulative ${index} has invalid date`);
    pushIf(
      String(entry.date) !== String(cumulative[index]?.date),
      errors,
      `byCountryCumulative ${entry.date ?? index} does not align with cumulative`,
    );
    const countries = asRecordArray(entry.countries);
    const cumulativeTotals = cumulative[index];
    const requiresCountries =
      String(entry.date) >= WAR_START_MONTH &&
      hasValidTotals(cumulativeTotals) &&
      cumulativeTotals.total > 0;
    pushIf(
      requiresCountries && countries.length === 0,
      errors,
      `byCountryCumulative ${entry.date ?? index} has no countries`,
    );
    for (const country of countries) {
      pushIf(
        typeof country.country !== "string" || !hasValidTotals(country),
        errors,
        `byCountryCumulative ${entry.date ?? index} has invalid country data`,
      );
    }
  }

  const topWeapons = asRecordArray(value.topWeapons);
  for (const [index, weapon] of topWeapons.entries()) {
    pushIf(
      typeof weapon.name !== "string" || weapon.name === "[object Object]",
      errors,
      `topWeapons ${index} has invalid name`,
    );
    pushIf(!isFiniteNumber(weapon.count), errors, `topWeapons ${index} has invalid count`);
  }

  return { valid: errors.length === 0, errors };
}

export function isValidSpendingData(value: unknown): value is SpendingData {
  return validateSpendingData(value).valid;
}

export function spendingDataFingerprint(value: unknown): string {
  if (!isRecord(value)) return "invalid";
  const totals = hasValidTotals(value.totals) ? value.totals : ZERO_SPENDING_TOTALS;
  const cumulative = Array.isArray(value.cumulative) ? value.cumulative : [];
  const total = Math.round(totals.total * 1000);
  return [
    `r${isFiniteNumber(value.release) ? value.release : 0}`,
    `d${typeof value.lastUpdated === "string" ? value.lastUpdated : "unknown"}`,
    `m${cumulative.length}`,
    `t${total}`,
  ].join("-");
}

function isBeforeWar(timelineDate: string): boolean {
  if (/^\d{8}$/.test(timelineDate)) return timelineDate < WAR_START_DATE;
  const month = normalizeTimelineMonth(timelineDate);
  return month != null && month < WAR_START_MONTH;
}

export function normalizeTimelineMonth(timelineDate?: string | null): string | null {
  if (!timelineDate) return null;
  if (/^\d{8}$/.test(timelineDate)) {
    return `${timelineDate.slice(0, 4)}-${timelineDate.slice(4, 6)}`;
  }
  const match = timelineDate.match(/^(\d{4})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}` : null;
}

function findLatestAtOrBefore<T extends { date: string }>(items: T[], month: string): T | null {
  let found: T | null = null;
  for (const item of items) {
    if (item.date <= month) found = item;
    else break;
  }
  return found;
}

export function selectSpendingSnapshot(
  data: SpendingData,
  timelineDate?: string | null,
): SpendingSnapshot {
  const month = normalizeTimelineMonth(timelineDate);
  const isTimelineScoped = Boolean(timelineDate);

  if (timelineDate && isBeforeWar(timelineDate)) {
    return {
      totals: ZERO_SPENDING_TOTALS,
      byCountry: [],
      byMonth: [],
      donorCount: 0,
      isTimelineScoped,
      month,
    };
  }

  if (!month) {
    return {
      totals: data.totals,
      byCountry: data.byCountry,
      byMonth: data.byMonth,
      donorCount: data.donors,
      isTimelineScoped,
      month: null,
    };
  }

  const latestCumulative = data.cumulative.at(-1);
  if (latestCumulative && month > latestCumulative.date) {
    return {
      totals: data.totals,
      byCountry: data.byCountry,
      byMonth: data.byMonth,
      donorCount: data.donors,
      isTimelineScoped,
      month,
    };
  }

  const totals = findLatestAtOrBefore(data.cumulative, month);
  const countryEntry = findLatestAtOrBefore(data.byCountryCumulative ?? [], month);
  const byCountry = (countryEntry?.countries ?? [])
    .filter((country) => country.total > 0)
    .sort((a, b) => b.total - a.total);

  return {
    totals: totals ?? ZERO_SPENDING_TOTALS,
    byCountry,
    byMonth: data.byMonth.filter((entry) => entry.date <= month),
    donorCount: byCountry.length,
    isTimelineScoped,
    month,
  };
}
