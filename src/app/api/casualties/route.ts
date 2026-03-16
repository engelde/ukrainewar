import { NextResponse } from "next/server";
import { CASUALTIES_API } from "@/lib/constants";

export async function GET() {
  try {
    const res = await fetch(CASUALTIES_API, {
      next: { revalidate: 14400 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch casualty data" },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=14400, stale-while-revalidate=3600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
