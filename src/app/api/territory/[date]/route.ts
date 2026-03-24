import { NextResponse } from "next/server";
import { DEEPSTATE_DATA_BASE } from "@/lib/constants";

interface RouteParams {
  params: Promise<{ date: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { date } = await params;

  // Validate date format (YYYYMMDD)
  if (!/^\d{8}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date format. Use YYYYMMDD." }, { status: 400 });
  }

  try {
    const url = `${DEEPSTATE_DATA_BASE}/deepstatemap_data_${date}.geojson`;

    const res = await fetch(url, {
      next: { revalidate: 86400 }, // Historical data is immutable
    });

    if (!res.ok) {
      return NextResponse.json({ error: `No territory data for ${date}` }, { status: 404 });
    }

    const geojson = await res.json();

    return NextResponse.json(
      { date, geojson },
      {
        headers: {
          "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
        },
      },
    );
  } catch {
    return NextResponse.json({ error: "Failed to fetch territory data" }, { status: 500 });
  }
}
