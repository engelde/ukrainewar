import { NextResponse } from "next/server";
import { DEEPSTATE_DATA_BASE } from "@/lib/constants";

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export async function GET() {
  try {
    // Try today first, then fall back up to 5 days
    const now = new Date();
    let geojson = null;
    let dateUsed = "";

    for (let i = 0; i < 5; i++) {
      const tryDate = new Date(now);
      tryDate.setDate(tryDate.getDate() - i);
      const dateStr = formatDate(tryDate);
      const url = `${DEEPSTATE_DATA_BASE}/deepstatemap_data_${dateStr}.geojson`;

      const res = await fetch(url, {
        next: { revalidate: 43200 },
      });

      if (res.ok) {
        geojson = await res.json();
        dateUsed = dateStr;
        break;
      }
    }

    if (!geojson) {
      return NextResponse.json(
        { error: "No territory data available" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { date: dateUsed, geojson },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=43200, stale-while-revalidate=7200",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch territory data" },
      { status: 500 }
    );
  }
}
