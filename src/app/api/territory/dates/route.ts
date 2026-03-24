import { NextResponse } from "next/server";

const GITHUB_API = "https://api.github.com/repos/cyterat/deepstate-map-data/contents/data";

export async function GET() {
  try {
    // GitHub Contents API returns all files in a single response
    const res = await fetch(GITHUB_API, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "UkraineWarTracker/1.0",
      },
      next: { revalidate: 86400 }, // 24h cache
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch dates from GitHub" },
        { status: res.status },
      );
    }

    const items: Array<{ name: string }> = await res.json();

    const dates: string[] = [];
    for (const item of items) {
      const match = item.name.match(/deepstatemap_data_(\d{8})\.geojson/);
      if (match) {
        dates.push(match[1]);
      }
    }

    dates.sort();

    return NextResponse.json(
      { dates, count: dates.length },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
        },
      },
    );
  } catch {
    return NextResponse.json({ error: "Failed to fetch territory dates" }, { status: 500 });
  }
}
