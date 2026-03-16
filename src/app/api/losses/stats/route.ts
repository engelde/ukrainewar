import { NextResponse } from "next/server";
import { WARSPOTTING_API } from "@/lib/constants";

const headers = {
  "User-Agent": "UkraineWarTracker/1.0 (uawar.app)",
  Accept: "application/json",
};

export async function GET() {
  try {
    const res = await fetch(`${WARSPOTTING_API}/stats/russia/`, {
      headers,
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch equipment stats" },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
