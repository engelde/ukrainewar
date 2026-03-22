export const WARSPOTTING_API = "https://ukr.warspotting.net/api";
export const CASUALTIES_API = "https://russia-casualties-ukraine-war-parser.vercel.app/api";

export const MAP_CENTER: [number, number] = [34.5, 48.2];
export const MAP_ZOOM = 6;
export const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export const DEEPSTATE_DATA_BASE =
  "https://raw.githubusercontent.com/cyterat/deepstate-map-data/main/data";

export const CACHE_TTL = {
  STATS: 60 * 60, // 1 hour
  LOSSES_RECENT: 6 * 60 * 60, // 6 hours
  CASUALTIES: 4 * 60 * 60, // 4 hours
  TERRITORY: 12 * 60 * 60, // 12 hours
  ACLED: 24 * 60 * 60, // 24 hours
  EVENTS: 24 * 60 * 60, // 24 hours
} as const;

export const ACLED_API = "https://acleddata.com/api/acled/read";
export const ACLED_AUTH_URL = "https://acleddata.com/oauth/token";

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
  {
    name: "VIINA (Zhukov & Ayers)",
    url: "https://github.com/zhukovyuri/VIINA",
    description: "Territorial control from news articles",
  },
  {
    name: "Wikidata",
    url: "https://www.wikidata.org",
    description: "Structured war event data via SPARQL",
  },
  {
    name: "NASA FIRMS",
    url: "https://firms.modaps.eosdis.nasa.gov",
    description: "Satellite thermal anomaly detection (VIIRS)",
  },
  {
    name: "ENTSO-E",
    url: "https://transparency.entsoe.eu",
    description: "European electricity generation data",
  },
  {
    name: "ENTSOG",
    url: "https://transparency.entsog.eu",
    description: "European gas transmission flows",
  },
] as const;
