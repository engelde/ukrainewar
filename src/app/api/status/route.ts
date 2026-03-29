import { NextResponse } from "next/server";
import { cacheGet } from "@/lib/cache";

/**
 * GET /api/status
 *
 * Returns the cache freshness status of each data pipeline so the UI
 * can display how current each data source is.
 */

type PipelineType = "cached" | "static";

interface PipelineConfig {
  id: string;
  name: string;
  category: string;
  cacheKey: string | null;
  ttl: number;
  url: string;
  description: string;
  type: PipelineType;
}

const PIPELINES: PipelineConfig[] = [
  // ── Territory ──────────────────────────────────────────────────────────
  {
    id: "deepstate",
    name: "DeepState Map",
    category: "Territory",
    cacheKey: "territory-latest",
    ttl: 43200,
    url: "https://deepstatemap.live",
    description: "Frontline & territory control",
    type: "cached",
  },
  {
    id: "viina",
    name: "VIINA (Zhukov & Ayers)",
    category: "Territory",
    cacheKey: null,
    ttl: 0,
    url: "https://github.com/zhukovyuri/VIINA",
    description: "Historical territory tessellations",
    type: "static",
  },
  // ── Casualties ─────────────────────────────────────────────────────────
  {
    id: "casualties",
    name: "Ukrainian Ministry of Defence",
    category: "Casualties",
    cacheKey: "casualties-current",
    ttl: 14400,
    url: "https://www.mil.gov.ua",
    description: "Official daily casualty reports",
    type: "cached",
  },
  {
    id: "ohchr",
    name: "OHCHR",
    category: "Casualties",
    cacheKey: null,
    ttl: 0,
    url: "https://www.ohchr.org",
    description: "UN civilian casualty statistics",
    type: "static",
  },
  {
    id: "mediazona",
    name: "Mediazona / BBC",
    category: "Casualties",
    cacheKey: null,
    ttl: 0,
    url: "https://en.zona.media/article/2022/05/20/casualties_eng",
    description: "Confirmed-by-name investigations",
    type: "static",
  },

  // ── Equipment ──────────────────────────────────────────────────────────
  {
    id: "warspotting",
    name: "WarSpotting",
    category: "Equipment",
    cacheKey: "losses-stats",
    ttl: 3600,
    url: "https://warspotting.net",
    description: "Visually confirmed equipment losses",
    type: "cached",
  },

  // ── Events ─────────────────────────────────────────────────────────────
  {
    id: "events",
    name: "Wikidata / ACLED",
    category: "Events",
    cacheKey: null,
    ttl: 0,
    url: "https://www.wikidata.org",
    description: "Structured war events (prebuild)",
    type: "static",
  },
  {
    id: "acled",
    name: "ACLED",
    category: "Events",
    cacheKey: null,
    ttl: 0,
    url: "https://acleddata.com",
    description: "Armed conflict event data (prebuild)",
    type: "static",
  },
  {
    id: "battles",
    name: "ACLED Battles",
    category: "Events",
    cacheKey: "battles",
    ttl: 86400,
    url: "https://acleddata.com",
    description: "Major battles & high-fatality events",
    type: "cached",
  },
  {
    id: "firms",
    name: "NASA FIRMS",
    category: "Events",
    cacheKey: "firms:ukraine:nrt",
    ttl: 10800,
    url: "https://firms.modaps.eosdis.nasa.gov",
    description: "Satellite thermal anomalies (VIIRS)",
    type: "cached",
  },
  {
    id: "uaf",
    name: "Ukrainian Air Force",
    category: "Events",
    cacheKey: null,
    ttl: 0,
    url: "https://t.me/kpszsu",
    description: "Missile and drone attack reports",
    type: "static",
  },

  // ── Energy ─────────────────────────────────────────────────────────────
  {
    id: "energy",
    name: "ENTSO-E",
    category: "Energy",
    cacheKey: "energy:ukraine",
    ttl: 21600,
    url: "https://transparency.entsoe.eu",
    description: "Electricity generation data",
    type: "cached",
  },
  {
    id: "gas",
    name: "ENTSOG",
    category: "Energy",
    cacheKey: "gas:ukraine",
    ttl: 43200,
    url: "https://transparency.entsog.eu",
    description: "Gas transit flows",
    type: "cached",
  },

  // ── Humanitarian ───────────────────────────────────────────────────────
  {
    id: "funding",
    name: "HDX / OCHA",
    category: "Humanitarian",
    cacheKey: "humanitarian-funding",
    ttl: 86400,
    url: "https://data.humdata.org",
    description: "Humanitarian appeals & funding",
    type: "cached",
  },
  {
    id: "refugees",
    name: "UNHCR",
    category: "Humanitarian",
    cacheKey: "humanitarian-refugees",
    ttl: 86400,
    url: "https://data.unhcr.org",
    description: "Refugee & IDP statistics",
    type: "cached",
  },
  {
    id: "spending",
    name: "Kiel Institute",
    category: "Humanitarian",
    cacheKey: null,
    ttl: 0,
    url: "https://www.ifw-kiel.de/topics/war-against-ukraine/ukraine-support-tracker/",
    description: "Bilateral aid tracker (prebuild, weekly update)",
    type: "static",
  },

  // ── International ──────────────────────────────────────────────────────
  {
    id: "sanctions",
    name: "UK OFSI Sanctions",
    category: "International",
    cacheKey: "sanctions-live",
    ttl: 86400,
    url: "https://www.gov.uk/government/publications/the-uk-sanctions-list",
    description: "Consolidated sanctions list",
    type: "cached",
  },
  {
    id: "alliance",
    name: "Alliance Alignment",
    category: "International",
    cacheKey: null,
    ttl: 0,
    url: "https://www.un.org/en/",
    description: "Country alignment based on UN votes (prebuild)",
    type: "static",
  },
];

const DAY = 86400;

export async function GET() {
  const results = await Promise.all(
    PIPELINES.map(async (pipeline) => {
      if (pipeline.type === "static" || !pipeline.cacheKey) {
        return {
          id: pipeline.id,
          name: pipeline.name,
          category: pipeline.category,
          url: pipeline.url,
          description: pipeline.description,
          status: "static" as const,
          lastUpdated: null,
          ttl: pipeline.ttl,
          age: null,
        };
      }

      const entry = await cacheGet(pipeline.cacheKey);

      if (!entry) {
        return {
          id: pipeline.id,
          name: pipeline.name,
          category: pipeline.category,
          url: pipeline.url,
          description: pipeline.description,
          status: "unknown" as const,
          lastUpdated: null,
          ttl: pipeline.ttl,
          age: null,
        };
      }

      const ageSeconds = Math.floor((Date.now() - entry.timestamp) / 1000);

      let status: "live" | "cached" | "stale";
      if (ageSeconds < DAY) {
        status = "live";
      } else if (ageSeconds < 7 * DAY) {
        status = "cached";
      } else {
        status = "stale";
      }

      return {
        id: pipeline.id,
        name: pipeline.name,
        category: pipeline.category,
        url: pipeline.url,
        description: pipeline.description,
        status,
        lastUpdated: entry.timestamp,
        ttl: entry.ttl,
        age: ageSeconds,
      };
    }),
  );

  return NextResponse.json(
    { pipelines: results, timestamp: Date.now() },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
