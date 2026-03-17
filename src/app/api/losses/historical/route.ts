import { NextRequest, NextResponse } from "next/server";
import { WARSPOTTING_API } from "@/lib/constants";

const headers = {
  "User-Agent": "UkraineWarTracker/1.0 (uawar.app)",
  Accept: "application/json",
};

// In-memory cache keyed by date
const dateCache = new Map<string, { data: unknown; cachedAt: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date"); // YYYY-MM-DD format

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "date parameter required in YYYY-MM-DD format" },
      { status: 400 }
    );
  }

  try {
    const now = Date.now();
    const cached = dateCache.get(date);
    if (cached && now - cached.cachedAt < CACHE_TTL) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=3600",
          "X-Data-Source": "cache",
        },
      });
    }

    const res = await fetch(
      `${WARSPOTTING_API}/losses/russia/${date}/`,
      { headers }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `WarSpotting API returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    dateCache.set(date, { data, cachedAt: now });

    // Prevent unbounded cache growth — keep last 60 dates
    if (dateCache.size > 60) {
      const oldest = [...dateCache.entries()]
        .sort((a, b) => a[1].cachedAt - b[1].cachedAt)
        .slice(0, dateCache.size - 60);
      for (const [key] of oldest) dateCache.delete(key);
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=3600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch historical losses" },
      { status: 500 }
    );
  }
}
