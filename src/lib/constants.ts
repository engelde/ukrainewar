export const WARSPOTTING_API = "https://ukr.warspotting.net/api";
export const CASUALTIES_API =
  "https://russia-casualties-ukraine-war-parser.vercel.app/api";

export const MAP_CENTER: [number, number] = [31.1656, 48.3794];
export const MAP_ZOOM = 6;
export const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export const CACHE_TTL = {
  STATS: 60 * 60, // 1 hour
  LOSSES_RECENT: 6 * 60 * 60, // 6 hours
  CASUALTIES: 4 * 60 * 60, // 4 hours
} as const;

export const DATA_SOURCES = [
  {
    name: "WarSpotting",
    url: "https://warspotting.net",
    description: "Visually confirmed equipment losses",
  },
  {
    name: "Ukrainian Ministry of Defence",
    url: "https://www.mil.gov.ua",
    description: "Official daily casualty reports",
  },
  {
    name: "DeepState Map",
    url: "https://deepstatemap.live",
    description: "Territory control and frontline data",
  },
  {
    name: "ACLED",
    url: "https://acleddata.com",
    description: "Conflict event data",
  },
  {
    name: "HDX / OCHA",
    url: "https://data.humdata.org",
    description: "Humanitarian data",
  },
  {
    name: "UNHCR",
    url: "https://data.unhcr.org",
    description: "Refugee data",
  },
  {
    name: "Kiel Institute",
    url: "https://www.kielinstitut.de",
    description: "Ukraine Support Tracker",
  },
] as const;
