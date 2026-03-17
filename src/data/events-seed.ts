import type { WarEvent } from "./events";

/**
 * Curated seed events that no external API covers.
 * These are political, diplomatic, and editorial events
 * that are important to the war's timeline but don't appear
 * in conflict databases like ACLED or Wikidata.
 *
 * Wikidata SPARQL covers military events (battles, sieges, strikes).
 * ACLED covers granular daily conflict events.
 * This file fills the gap for political/diplomatic milestones.
 */
export const SEED_EVENTS: WarEvent[] = [
  {
    date: "20220227",
    label: "Sanctions & SWIFT",
    description: "Western nations impose sweeping sanctions; select Russian banks cut from SWIFT",
  },
  {
    date: "20220930",
    label: "Annexation declared",
    description: "Russia illegally annexes Donetsk, Luhansk, Zaporizhzhia, and Kherson oblasts",
    lat: 55.751,
    lng: 37.618,
  },
  {
    date: "20230121",
    label: "Tanks pledged",
    description: "Western allies pledge Leopard 2 and M1 Abrams tanks to Ukraine",
  },
  {
    date: "20230624",
    label: "Wagner mutiny",
    description:
      "Wagner Group leader Prigozhin launches brief armed rebellion, marching toward Moscow before standing down",
    lat: 51.733,
    lng: 39.853,
  },
  {
    date: "20230823",
    label: "Prigozhin killed",
    description:
      "Wagner leader Yevgeny Prigozhin dies in plane crash two months after aborted mutiny",
  },
  {
    date: "20240217",
    label: "Navalny death",
    description:
      "Russian opposition leader Alexei Navalny dies in Arctic penal colony under suspicious circumstances",
  },
  {
    date: "20240613",
    label: "G7 frozen assets",
    description:
      "G7 leaders agree to use interest from $300B in frozen Russian assets to provide $50B loan to Ukraine",
  },
  {
    date: "20241105",
    label: "US election",
    description:
      "Donald Trump wins US presidential election, casting uncertainty over Ukraine support",
  },
  {
    date: "20241216",
    label: "DPRK troops deployed",
    description: "North Korean soldiers confirmed fighting alongside Russian forces in Kursk",
    lat: 51.416,
    lng: 34.695,
  },
  {
    date: "20250120",
    label: "Trump inaugurated",
    description: "Trump takes office, signals prioritization of ending the war",
  },
  {
    date: "20250224",
    label: "3rd anniversary",
    description: "Three years since Russia's full-scale invasion of Ukraine",
    lat: 50.45,
    lng: 30.52,
  },
  {
    date: "20250318",
    label: "Ceasefire proposed",
    description:
      "Trump-Putin call results in proposed limited ceasefire on energy infrastructure; quickly broken",
  },
  {
    date: "20250815",
    label: "Alaska summit",
    description:
      "Trump and Putin meet at Joint Base Elmendorf-Richardson in Anchorage; no ceasefire achieved",
  },
  {
    date: "20250818",
    label: "DC summit",
    description:
      "Trump hosts Zelenskyy and European/NATO leaders at White House; cautious optimism, no breakthrough",
  },
];
