import { NextResponse } from "next/server";
import { cacheGet, cacheSet, isFresh, isUsableStale } from "@/lib/cache";
import { CACHE_TTL, CASUALTIES_API } from "@/lib/constants";

const CACHE_KEY = "casualties-current";

let inflightPromise: Promise<unknown> | null = null;

async function fetchCasualties(): Promise<unknown> {
  const res = await fetch(CASUALTIES_API, {
    next: { revalidate: 14400 },
  });
  if (!res.ok) throw new Error(`Casualties API returned ${res.status}`);
  return res.json();
}

function refreshInBackground() {
  if (inflightPromise) return;
  inflightPromise = fetchCasualties()
    .then(async (data) => {
      await cacheSet(CACHE_KEY, data, CACHE_TTL.CASUALTIES);
      return data;
    })
    .catch((err) => {
      console.error("[casualties] Background refresh failed:", err);
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
          "Cache-Control": "public, s-maxage=14400, stale-while-revalidate=3600",
          "X-Cache": "HIT",
        },
      });
    }

    if (cached && isUsableStale(cached)) {
      refreshInBackground();
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=14400",
          "X-Cache": "STALE",
        },
      });
    }

    const data = await fetchCasualties();
    await cacheSet(CACHE_KEY, data, CACHE_TTL.CASUALTIES);

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=14400, stale-while-revalidate=3600",
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
