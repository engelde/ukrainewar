import { NextResponse } from "next/server";
import { ACLED_API, ACLED_AUTH_URL, CACHE_TTL } from "@/lib/constants";
import type { AcledEvent } from "@/lib/types";

const ACLED_EMAIL = process.env.ACLED_EMAIL;
const ACLED_PASSWORD = process.env.ACLED_PASSWORD;

interface AcledApiRow {
  event_id_cnty: string;
  event_date: string;
  event_type: string;
  sub_event_type: string;
  actor1: string;
  actor2: string;
  location: string;
  latitude: string;
  longitude: string;
  fatalities: string;
  notes: string;
  admin1: string;
}

// Cache token in memory (valid 24h, refresh before expiry)
let cachedToken: { access_token: string; expires_at: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (!ACLED_EMAIL || !ACLED_PASSWORD) {
    throw new Error("ACLED credentials not configured");
  }

  // Reuse cached token if still valid (with 5-min buffer)
  if (cachedToken && Date.now() < cachedToken.expires_at - 300_000) {
    return cachedToken.access_token;
  }

  const res = await fetch(ACLED_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      username: ACLED_EMAIL,
      password: ACLED_PASSWORD,
      grant_type: "password",
      client_id: "acled",
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ACLED auth failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  cachedToken = {
    access_token: json.access_token,
    expires_at: Date.now() + (json.expires_in || 86400) * 1000,
  };

  return cachedToken.access_token;
}

// Paginate through all ACLED data for Ukraine
async function fetchAllPages(): Promise<AcledEvent[]> {
  const token = await getAccessToken();
  const events: AcledEvent[] = [];
  let page = 0;
  const limit = 5000;

  while (true) {
    const params = new URLSearchParams({
      country: "Ukraine",
      event_date: "2022-02-24|2026-12-31",
      event_date_where: "BETWEEN",
      limit: String(limit),
      offset: String(page * limit),
      fields:
        "event_id_cnty|event_date|event_type|sub_event_type|actor1|actor2|location|latitude|longitude|fatalities|notes|admin1",
    });

    const res = await fetch(`${ACLED_API}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`ACLED API error (${res.status}): ${text}`);
    }

    const json = await res.json();
    const rows: AcledApiRow[] = json.data || [];

    if (rows.length === 0) break;

    for (const row of rows) {
      const lat = parseFloat(row.latitude);
      const lng = parseFloat(row.longitude);
      if (Number.isNaN(lat) || Number.isNaN(lng) || (lat === 0 && lng === 0)) continue;

      events.push({
        event_id: row.event_id_cnty,
        event_date: row.event_date,
        event_type: row.event_type,
        sub_event_type: row.sub_event_type,
        actor1: row.actor1 || "",
        actor2: row.actor2 || "",
        location: row.location || "",
        latitude: lat,
        longitude: lng,
        fatalities: parseInt(row.fatalities, 10) || 0,
        notes: row.notes || "",
        admin1: row.admin1 || "",
      });
    }

    if (rows.length < limit) break;
    page++;
  }

  return events;
}

export async function GET() {
  try {
    const events = await fetchAllPages();

    // Convert to GeoJSON for efficient map rendering
    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: events.map((e) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [e.longitude, e.latitude],
        },
        properties: {
          id: e.event_id,
          date: e.event_date,
          type: e.event_type,
          subtype: e.sub_event_type,
          actor1: e.actor1,
          actor2: e.actor2,
          location: e.location,
          fatalities: e.fatalities,
          admin1: e.admin1,
          notes: e.notes,
        },
      })),
    };

    return NextResponse.json(geojson, {
      headers: {
        "Cache-Control": `public, s-maxage=${CACHE_TTL.ACLED}, stale-while-revalidate=3600`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch ACLED data";
    console.error("ACLED API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
