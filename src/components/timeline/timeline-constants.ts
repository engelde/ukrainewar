export interface SpeedOption {
  label: string;
  ms: number;
}

export const SPEED_OPTIONS: SpeedOption[] = [
  { label: "0.25×", ms: 1600 },
  { label: "0.5×", ms: 800 },
  { label: "1×", ms: 400 },
  { label: "2×", ms: 200 },
  { label: "4×", ms: 100 },
  { label: "8×", ms: 50 },
];

export const PIXELS_PER_DAY = 2;

export const WAR_START_DATE = "20220224";

export const YEAR_MARKS = ["2021", "2022", "2023", "2024", "2025", "2026"];

export function formatDateDisplay(dateStr: string): string {
  const m = dateStr.slice(4, 6);
  const d = dateStr.slice(6, 8);
  const y = dateStr.slice(0, 4);
  return `${m}.${d}.${y}`;
}

export function formatDateShort(dateStr: string): string {
  const m = dateStr.slice(4, 6);
  const d = dateStr.slice(6, 8);
  return `${m}.${d}`;
}

export const TIMELINE_START_DATE = "2021-03-01";

export function generateDateRange(): string[] {
  const dates: string[] = [];
  const start = new Date(TIMELINE_START_DATE);
  const end = new Date();
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    dates.push(`${y}${m}${day}`);
  }
  return dates;
}
