/**
 * Cloudflare Worker — Daily Data Refresh
 *
 * Runs on a cron schedule to warm API caches by hitting each data endpoint.
 * This ensures data stays fresh even without user traffic.
 *
 * Endpoints warmed:
 * - /api/spending         (Kiel Institute XLSX → 7-day cache)
 * - /api/acled/regional   (HDX XLSX files → 24h cache)
 * - /api/casualties       (MoD daily losses → 4h cache)
 * - /api/humanitarian/refugees    (UNHCR → 24h cache)
 * - /api/humanitarian/funding     (OCHA FTS → 24h cache)
 * - /api/humanitarian/civilian-casualties (OHCHR → 24h cache)
 *
 * Deploy: cd workers/data-refresh && npx wrangler deploy
 */

interface Env {
  APP_URL: string;
}

const ENDPOINTS = [
  "/api/spending",
  "/api/acled/regional",
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
    const baseUrl = env.APP_URL || "https://uawar.app";
    const results: { endpoint: string; status: number | string; ms: number }[] =
      [];

    const tasks = ENDPOINTS.map(async (endpoint) => {
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
        name: "uawar-data-refresh",
        description: "Daily cron worker for warming data caches",
        endpoints: ENDPOINTS,
        schedule: "0 6 * * * (daily at 06:00 UTC)",
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  },
};
