import { NextResponse } from "next/server";
import { WARSPOTTING_API } from "@/lib/constants";

const headers = {
  "User-Agent": "UkraineWarTracker/1.0 (ukrainewar.app)",
  Accept: "application/json",
};

export async function GET() {
  try {
    const res = await fetch(`${WARSPOTTING_API}/losses/russia/recent/`, {
      headers,
      next: { revalidate: 21600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch recent losses" },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=3600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
