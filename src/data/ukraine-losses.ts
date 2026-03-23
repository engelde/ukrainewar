/**
 * Ukrainian loss estimates from multiple independent sources.
 *
 * Ukraine does not officially publish comprehensive casualty figures.
 * These estimates are compiled from:
 * - Mediazona + BBC Russian Service: confirmed deaths by name from obituaries,
 *   social media, and official regional reports (conservative lower bound)
 * - US/UK/EU intelligence assessments (leaked or officially stated)
 * - Ukrainian officials' partial disclosures
 *
 * All figures are approximate and should be presented with source attribution.
 * Mediazona counts are verified minimums; actual figures are likely higher.
 */

export interface UkraineLossEstimate {
  date: string; // YYYYMMDD — date the estimate was reported
  source: string;
  sourceUrl?: string;
  militaryKilled?: number;
  militaryWounded?: number;
  militaryTotal?: number; // killed + wounded if combined
  civilianKilled?: number;
  civilianWounded?: number;
  notes: string;
}

export const UKRAINE_LOSS_ESTIMATES: UkraineLossEstimate[] = [
  // ── 2022 ──────────────────────────────────────────────────────────────
  {
    date: "20220601",
    source: "President Zelenskyy",
    militaryKilled: 100,
    notes:
      "Zelenskyy stated Ukraine was losing 60-100 soldiers per day during the peak of Severodonetsk fighting",
  },
  {
    date: "20221130",
    source: "European Commission President von der Leyen",
    militaryKilled: 100000,
    civilianKilled: 20000,
    notes:
      "Ursula von der Leyen cited 100,000 Ukrainian military killed; figure was later retracted from official statement as unverified",
  },
  {
    date: "20221212",
    source: "Norwegian Chief of Defence",
    militaryKilled: 10000,
    militaryWounded: 30000,
    notes: "Gen. Eirik Kristoffersen estimated 10,000 killed and 30,000 wounded through late 2022",
  },

  // ── 2023 ──────────────────────────────────────────────────────────────
  {
    date: "20230224",
    source: "Mediazona + BBC Russian Service",
    sourceUrl: "https://en.zona.media/article/2022/05/20/casualties_eng",
    militaryKilled: 15500,
    notes:
      "Confirmed by name from obituaries, social media, and regional reports. Known to be a significant undercount — actual figures estimated 3-5x higher",
  },
  {
    date: "20230824",
    source: "US intelligence assessment (NYT)",
    militaryKilled: 70000,
    militaryWounded: 120000,
    notes:
      "Leaked US estimate of approximately 70,000 killed and 100,000-120,000 wounded through August 2023",
  },

  // ── 2024 ──────────────────────────────────────────────────────────────
  {
    date: "20240214",
    source: "President Zelenskyy",
    militaryKilled: 31000,
    notes:
      "Zelenskyy acknowledged 31,000 Ukrainian military killed; widely considered a conservative official figure",
  },
  {
    date: "20240224",
    source: "Mediazona + BBC Russian Service",
    sourceUrl: "https://en.zona.media/article/2022/05/20/casualties_eng",
    militaryKilled: 27300,
    notes:
      "Confirmed deaths by name after 2 years of war. Acknowledged as a minimum — true toll estimated significantly higher",
  },
  {
    date: "20240401",
    source: "UK Ministry of Defence assessment",
    militaryTotal: 200000,
    notes: "Combined killed and wounded estimate for Ukrainian forces through early 2024",
  },
  {
    date: "20240901",
    source: "Wall Street Journal analysis",
    militaryKilled: 80000,
    militaryWounded: 400000,
    notes:
      "WSJ reported approximately 80,000 killed and 400,000 wounded based on Western intelligence assessments",
  },
  {
    date: "20241201",
    source: "Mediazona + BBC Russian Service",
    sourceUrl: "https://en.zona.media/article/2022/05/20/casualties_eng",
    militaryKilled: 37000,
    notes:
      "Confirmed deaths by name. Actual figures are estimated to be considerably higher based on analysis of incomplete regional data",
  },

  // ── 2025 ──────────────────────────────────────────────────────────────
  {
    date: "20250224",
    source: "Mediazona + BBC Russian Service",
    sourceUrl: "https://en.zona.media/article/2022/05/20/casualties_eng",
    militaryKilled: 43000,
    notes:
      "Confirmed deaths by name at the 3-year mark. Represents a verified minimum; true figure estimated at 2-3x this count based on coverage gaps",
  },
  {
    date: "20250301",
    source: "Western intelligence consensus",
    militaryKilled: 100000,
    militaryWounded: 400000,
    notes:
      "Combined Western estimates suggest approximately 100,000 killed and 300,000-400,000 wounded through early 2025",
  },
];

/**
 * UN OHCHR verified civilian casualties (conservative minimum).
 * Source: https://www.ohchr.org/en/news/press-releases
 */
export const CIVILIAN_CASUALTIES_OHCHR = {
  asOf: "20250228",
  source: "UN Office of the High Commissioner for Human Rights",
  sourceUrl: "https://www.ohchr.org/en/news/press-releases",
  killed: 12500,
  injured: 27200,
  notes:
    "OHCHR verified minimum. Actual civilian toll is believed to be considerably higher, particularly in areas under Russian occupation where verification is difficult",
};

/**
 * Return a summary suitable for display in the UI.
 */
export function getUkraineLossSummary() {
  const latest = UKRAINE_LOSS_ESTIMATES[UKRAINE_LOSS_ESTIMATES.length - 1];
  const mediazona = [...UKRAINE_LOSS_ESTIMATES]
    .reverse()
    .find((e) => e.source.includes("Mediazona"));

  return {
    latestEstimate: latest,
    mediazonaConfirmed: mediazona,
    civilianOHCHR: CIVILIAN_CASUALTIES_OHCHR,
    disclaimer:
      "Ukraine does not officially publish comprehensive military casualty figures. Estimates vary widely between sources. Mediazona counts are confirmed minimums based on named individuals.",
  };
}
