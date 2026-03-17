import { NextResponse } from "next/server";

let cachedData: Record<string, unknown> | null = null;
let cachedAt = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(request: Request) {
  try {
    const now = Date.now();
    if (cachedData && now - cachedAt < CACHE_TTL) {
      return NextResponse.json(cachedData, {
        headers: {
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=3600",
          "X-Data-Source": "cache",
        },
      });
    }

    const origin = new URL(request.url).origin;
    const res = await fetch(`${origin}/data/civilian-casualties.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    cachedData = data;
    cachedAt = now;

    return NextResponse.json(data, {
      headers: {
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=3600",
        "X-Data-Source": "fresh",
      },
    });
  } catch (error) {
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          "Cache-Control": "public, s-maxage=3600",
          "X-Data-Source": "stale-cache",
        },
      });
    }

    return NextResponse.json(
      {
        error: "Failed to load civilian casualties data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
