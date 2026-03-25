import { type NextRequest, NextResponse } from "next/server";

/**
 * POST /api/cache/purge
 *
 * Purges the Cloudflare CDN edge cache after data warming completes.
 * This ensures users get fresh warmed data instead of stale cold responses
 * that may have been cached at the edge during the warming window.
 *
 * Supports two modes:
 * - Full purge: no body or `{ "purge_everything": true }`
 * - Selective purge: `{ "files": ["https://ukrainewar.app/api/casualties", ...] }`
 *
 * Protected by CACHE_REFRESH_SECRET.
 * Requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID env vars.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CACHE_REFRESH_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;

  if (!apiToken || !zoneId) {
    return NextResponse.json(
      { error: "Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ZONE_ID" },
      { status: 500 },
    );
  }

  let body: Record<string, unknown>;
  try {
    const reqBody = await request.json();
    if (reqBody?.files && Array.isArray(reqBody.files)) {
      body = { files: reqBody.files };
    } else {
      body = { purge_everything: true };
    }
  } catch {
    body = { purge_everything: true };
  }

  const start = Date.now();
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const result = await res.json();
    const ms = Date.now() - start;

    if (res.ok && (result as { success?: boolean }).success) {
      return NextResponse.json({
        purged: true,
        mode: body.purge_everything ? "full" : "selective",
        ms,
      });
    }

    return NextResponse.json(
      {
        purged: false,
        error: (result as { errors?: unknown[] }).errors || "Unknown error",
        ms,
      },
      { status: 502 },
    );
  } catch (err) {
    return NextResponse.json(
      {
        purged: false,
        error: err instanceof Error ? err.message : "Unknown error",
        ms: Date.now() - start,
      },
      { status: 502 },
    );
  }
}
