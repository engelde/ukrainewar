/**
 * Cloudflare Worker — Data Refresh
 *
 * Runs every 6 hours to:
 * 1. Pre-warm the ACLED persistent cache via /api/cache/refresh (slow API, ~45s)
 * 2. Warm all other API endpoint caches by hitting them
 * 3. Pre-warm FIRMS thermal anomaly cache for historical dates (every 7th day)
 *
 * All endpoints now use persistent multi-layer caching (file dev / KV prod).
 *
 * Deploy: cd workers/data-refresh && npx wrangler deploy
 */

interface Env {
  APP_URL: string;
  CACHE_REFRESH_SECRET?: string;
  CLOUDFLARE_API_TOKEN?: string;
  CLOUDFLARE_ZONE_ID?: string;
}

// Endpoints hit with GET to warm caches
const GET_ENDPOINTS = [
  "/api/acled/regional",
  "/api/events",
  "/api/spending",
  "/api/casualties",
  "/api/casualties/history",
  "/api/casualties/daily-totals",
  "/api/losses/stats",
  "/api/losses/recent",
  "/api/losses/trend",
  "/api/humanitarian/refugees",
  "/api/humanitarian/funding",
  "/api/humanitarian/civilian-casualties",
  "/api/territory",
  "/api/firms",
  "/api/energy",
  "/api/energy/gas",
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
      Promise.all(tasks).then(async () => {
        // 3. Pre-warm FIRMS historical cache (every 7th day from invasion to now)
        const firmsStart = Date.now();
        try {
          const headers: Record<string, string> = {
            "User-Agent": "UkraineWarTracker-CronWorker/1.0",
            "Content-Type": "application/json",
          };
          if (env.CACHE_REFRESH_SECRET) {
            headers["Authorization"] = `Bearer ${env.CACHE_REFRESH_SECRET}`;
          }

          const res = await fetch(`${baseUrl}/api/cache/refresh-firms`, {
            method: "POST",
            headers,
          });
          const body = await res.json() as { warmed: number; skipped: number; failed: number };
          results.push({
            endpoint: "/api/cache/refresh-firms",
            status: res.status,
            ms: Date.now() - firmsStart,
          });
          console.log(
            `FIRMS pre-warm: ${body.warmed} warmed, ${body.skipped} skipped, ${body.failed} failed`
          );
        } catch (err) {
          results.push({
            endpoint: "/api/cache/refresh-firms",
            status: err instanceof Error ? err.message : "error",
            ms: Date.now() - firmsStart,
          });
        }

        console.log(
          "Data refresh complete:",
          JSON.stringify(results, null, 2)
        );

        // 4. Purge Cloudflare CDN edge cache so users get fresh warmed data
        if (env.CACHE_REFRESH_SECRET) {
          const purgeStart = Date.now();
          try {
            const purgeRes = await fetch(`${baseUrl}/api/cache/purge`, {
              method: "POST",
              headers: {
                "User-Agent": "UkraineWarTracker-CronWorker/1.0",
                "Content-Type": "application/json",
                Authorization: `Bearer ${env.CACHE_REFRESH_SECRET}`,
              },
              body: JSON.stringify({ purge_everything: true }),
            });
            const purgeBody = (await purgeRes.json()) as {
              purged: boolean;
              mode?: string;
            };
            console.log(
              `CDN cache purge: ${purgeBody.purged ? "success" : "failed"} (${purgeBody.mode || "unknown"}) in ${Date.now() - purgeStart}ms`
            );
          } catch (err) {
            console.log(
              `CDN cache purge error: ${err instanceof Error ? err.message : "unknown"} in ${Date.now() - purgeStart}ms`
            );
          }
        }
      })
    );
  },

  async fetch(): Promise<Response> {
    return new Response(
      JSON.stringify({
        name: "ukrainewar-data-refresh",
        description: "Daily cron worker for warming data caches",
        endpoints: ["/api/cache/refresh (POST)", "/api/cache/refresh-firms (POST)", ...GET_ENDPOINTS],
        schedule: "0 */6 * * * (every 6 hours)",
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  },
};
