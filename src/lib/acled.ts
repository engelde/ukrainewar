import { ACLED_API, ACLED_AUTH_URL } from "@/lib/constants";
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

export async function getAccessToken(): Promise<string> {
  if (!ACLED_EMAIL || !ACLED_PASSWORD) {
    throw new Error("ACLED credentials not configured");
  }

  if (cachedToken && Date.now() < cachedToken.expires_at - 300_000) {
    return cachedToken.access_token;
  }

  const res = await fetch(ACLED_AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "UkraineWarTracker/1.0",
    },
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

/**
 * Fetch ACLED events for a specific date range with pagination.
 * Supports additional filter params (event_type, fatalities, etc).
 */
export async function fetchAcledPages(
  start: string,
  end: string,
  extraParams?: Record<string, string>,
): Promise<AcledEvent[]> {
  const token = await getAccessToken();
  const events: AcledEvent[] = [];
  let page = 0;
  const limit = 5000;

  while (true) {
    const params = new URLSearchParams({
      country: "Ukraine",
      event_date: `${start}|${end}`,
      event_date_where: "BETWEEN",
      limit: String(limit),
      offset: String(page * limit),
      fields:
        "event_id_cnty|event_date|event_type|sub_event_type|actor1|actor2|location|latitude|longitude|fatalities|notes|admin1",
      ...extraParams,
    });

    const res = await fetch(`${ACLED_API}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "UkraineWarTracker/1.0",
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
      const lat = Number.parseFloat(row.latitude);
      const lng = Number.parseFloat(row.longitude);
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
        fatalities: Number.parseInt(row.fatalities, 10) || 0,
        notes: row.notes || "",
        admin1: row.admin1 || "",
      });
    }

    if (rows.length < limit) break;
    page++;
  }

  return events;
}
