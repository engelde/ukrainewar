import { NextResponse } from "next/server";
import { cacheGet, cacheSet, isFresh, isUsableStale } from "@/lib/cache";
import { CACHE_TTL, WARSPOTTING_API } from "@/lib/constants";

const CACHE_KEY = "losses-recent";

const headers = {
  "User-Agent": "UkraineWarTracker/1.0 (ukrainewar.app)",
  Accept: "application/json",
};

let inflightPromise: Promise<unknown> | null = null;

async function fetchRecent(): Promise<unknown> {
  const res = await fetch(`${WARSPOTTING_API}/losses/russia/recent/`, {
    headers,
    next: { revalidate: 21600 },
  });
  if (!res.ok) throw new Error(`WarSpotting API returned ${res.status}`);
  return res.json();
}

function refreshInBackground() {
  if (inflightPromise) return;
  inflightPromise = fetchRecent()
    .then(async (data) => {
      await cacheSet(CACHE_KEY, data, CACHE_TTL.LOSSES_RECENT);
      return data;
    })
    .catch((err) => {
      console.error("[losses/recent] Background refresh failed:", err);
    })
    .finally(() => {
      inflightPromise = null;
    });
}

export async function GET() {
  try {
    const cached = await cacheGet<unknown>(CACHE_KEY);

    if (cached && isFresh(cached)) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=3600",
          "X-Cache": "HIT",
        },
      });
    }

    if (cached && isUsableStale(cached)) {
      refreshInBackground();
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=21600",
          "X-Cache": "STALE",
        },
      });
    }

    const data = await fetchRecent();
    await cacheSet(CACHE_KEY, data, CACHE_TTL.LOSSES_RECENT);

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=3600",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    const stale = await cacheGet<unknown>(CACHE_KEY);
    if (stale) {
      return NextResponse.json(stale.data, {
        headers: {
          "Cache-Control": "public, s-maxage=3600",
          "X-Cache": "ERROR-STALE",
          "X-Error": error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
