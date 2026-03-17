import en from "./en.json";
import uk from "./uk.json";

export type Locale = "en" | "uk";

type Messages = typeof en;

const messages: Record<Locale, Messages> = { en, uk };

let currentLocale: Locale = "en";

export function setLocale(locale: Locale) {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function getMessages(locale?: Locale): Messages {
  return messages[locale ?? currentLocale];
}

/**
 * Retrieve a nested translation value by dot-separated key path.
 * Supports simple interpolation via `{name}` placeholders.
 *
 * @example
 * t("stats.tanks")            // "Tanks"
 * t("stats.confirmedLosses", { count: 30 }) // "Confirmed losses · last 30 days"
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const parts = key.split(".");
  // biome-ignore lint/suspicious/noExplicitAny: traversing JSON
  let value: any = messages[currentLocale];

  for (const part of parts) {
    if (value == null) return key;
    value = value[part];
  }

  if (typeof value !== "string") return key;

  if (params) {
    return value.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
  }

  return value;
}

/**
 * Get the short month names array for the current locale.
 */
export function getMonthsShort(locale?: Locale): string[] {
  return messages[locale ?? currentLocale].months.short;
}
