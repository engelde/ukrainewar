import { WARSPOTTING_API, CASUALTIES_API } from "./constants";
import type {
  CasualtyData,
  WarSpottingStats,
  WarSpottingLossesResponse,
} from "./types";

const WARSPOTTING_HEADERS = {
  "User-Agent": "UkraineWarTracker/1.0 (uawar.app)",
  Accept: "application/json",
};

export async function fetchWarSpottingStats(): Promise<WarSpottingStats> {
  const res = await fetch(`${WARSPOTTING_API}/stats/russia/`, {
    headers: WARSPOTTING_HEADERS,
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`WarSpotting stats failed: ${res.status}`);
  }

  return res.json();
}

export async function fetchWarSpottingRecentLosses(): Promise<WarSpottingLossesResponse> {
  const res = await fetch(`${WARSPOTTING_API}/losses/russia/recent/`, {
    headers: WARSPOTTING_HEADERS,
    next: { revalidate: 21600 },
  });

  if (!res.ok) {
    throw new Error(`WarSpotting recent losses failed: ${res.status}`);
  }

  return res.json();
}

export async function fetchCasualties(): Promise<CasualtyData> {
  const res = await fetch(CASUALTIES_API, {
    next: { revalidate: 14400 },
  });

  if (!res.ok) {
    throw new Error(`Casualties API failed: ${res.status}`);
  }

  return res.json();
}
