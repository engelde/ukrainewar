import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

let cachedData: Record<string, unknown> | null = null;
let cachedAt = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function GET() {
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

    const filePath = join(
      process.cwd(),
      "public",
      "data",
      "civilian-casualties.json"
    );
    const raw = await readFile(filePath, "utf-8");
    const data = JSON.parse(raw);

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
