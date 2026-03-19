/**
 * Cloudflare Worker — Daily Data Refresh
 *
 * Runs on a cron schedule to:
 * 1. Pre-warm the ACLED persistent cache via /api/cache/refresh (slow API, ~45s)
 * 2. Warm other API endpoint in-memory caches by hitting them
 *
 * Endpoints warmed:
 * - /api/cache/refresh     (ACLED map data → persistent cache, 24h TTL)
 * - /api/acled/regional    (HDX XLSX files → persistent cache, 24h TTL)
 * - /api/events            (Wikidata SPARQL + ACLED + curated → persistent cache, 24h TTL)
 * - /api/spending          (Kiel Institute XLSX → 7-day cache)
 * - /api/casualties        (MoD daily losses → 4h cache)
 * - /api/humanitarian/refugees           (UNHCR → 24h cache)
 * - /api/humanitarian/funding            (OCHA FTS → 24h cache)
 * - /api/humanitarian/civilian-casualties (OHCHR → 24h cache)
 *
 * Deploy: cd workers/data-refresh && npx wrangler deploy
 */

interface Env {
  APP_URL: string;
  CACHE_REFRESH_SECRET?: string;
}

// Endpoints hit with GET to warm caches
const GET_ENDPOINTS = [
  "/api/acled/regional",
  "/api/events",
  "/api/spending",
  "/api/casualties",
  "/api/humanitarian/refugees",
  "/api/humanitarian/funding",
  "/api/humanitarian/civilian-casualties",
];

export default {
  async scheduled(
    _event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    const baseUrl = env.APP_URL || "https://ukrainewar.app";
    const results: { endpoint: string; status: number | string; ms: number }[] =
      [];

    // 1. Pre-warm ACLED map cache first (slowest — ~45s)
    const refreshStart = Date.now();
    try {
      const headers: Record<string, string> = {
        "User-Agent": "UkraineWarTracker-CronWorker/1.0",
        "Content-Type": "application/json",
      };
      if (env.CACHE_REFRESH_SECRET) {
        headers["Authorization"] = `Bearer ${env.CACHE_REFRESH_SECRET}`;
      }

      const res = await fetch(`${baseUrl}/api/cache/refresh`, {
        method: "POST",
        headers,
      });
      results.push({
        endpoint: "/api/cache/refresh",
        status: res.status,
        ms: Date.now() - refreshStart,
      });
    } catch (err) {
      results.push({
        endpoint: "/api/cache/refresh",
        status: err instanceof Error ? err.message : "error",
        ms: Date.now() - refreshStart,
      });
    }

    // 2. Warm remaining endpoints in parallel
    const tasks = GET_ENDPOINTS.map(async (endpoint) => {
      const start = Date.now();
      try {
        const res = await fetch(`${baseUrl}${endpoint}`, {
          headers: {
            "User-Agent": "UkraineWarTracker-CronWorker/1.0",
          },
        });
        results.push({
          endpoint,
          status: res.status,
          ms: Date.now() - start,
        });
      } catch (err) {
        results.push({
          endpoint,
          status: err instanceof Error ? err.message : "error",
          ms: Date.now() - start,
        });
      }
    });

    ctx.waitUntil(
      Promise.all(tasks).then(() => {
        console.log(
          "Data refresh complete:",
          JSON.stringify(results, null, 2)
        );
      })
    );
  },

  async fetch(): Promise<Response> {
    return new Response(
      JSON.stringify({
        name: "ukrainewar-data-refresh",
        description: "Daily cron worker for warming data caches",
        endpoints: ["/api/cache/refresh (POST)", ...GET_ENDPOINTS],
        schedule: "0 */6 * * * (every 6 hours)",
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  },
};
