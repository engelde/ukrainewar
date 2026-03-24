import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a YYYYMMDD string as MM.DD.YYYY for display.
 */
export function formatDateDisplay(yyyymmdd: string): string {
  const m = yyyymmdd.slice(4, 6);
  const d = yyyymmdd.slice(6, 8);
  const y = yyyymmdd.slice(0, 4);
  return `${m}.${d}.${y}`;
}

/**
 * Format a YYYY-MM-DD (ISO-style) string as MM.DD.YYYY for display.
 */
export function formatISODate(isoDate: string): string {
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  return `${parts[1]}.${parts[2]}.${parts[0]}`;
}

/**
 * Format a YYYYMMDD date range as "MM.DD.YYYY – MM.DD.YYYY", "MM.DD.YYYY – Present",
 * or "MM.DD.YYYY – Ongoing" when the entry is flagged as ongoing.
 */
export function formatDateRange(start: string, end?: string, isOngoing?: boolean): string {
  if (isOngoing) return `${formatDateDisplay(start)} – Ongoing`;
  if (!end) return `${formatDateDisplay(start)} – Present`;
  return `${formatDateDisplay(start)} – ${formatDateDisplay(end)}`;
}
