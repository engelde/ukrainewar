import { CASUALTIES_API, WARSPOTTING_API } from "./constants";
import type {
  CasualtyData,
  EquipmentMarker,
  TerritoryResponse,
  WarSpottingLossesResponse,
  WarSpottingStats,
} from "./types";

const WARSPOTTING_HEADERS = {
  "User-Agent": "UkraineWarTracker/1.0 (ukrainewar.app)",
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

export async function fetchTerritory(): Promise<TerritoryResponse> {
  const res = await fetch("/api/territory");

  if (!res.ok) {
    throw new Error(`Territory API failed: ${res.status}`);
  }

  return res.json();
}

export function parseEquipmentMarkers(losses: WarSpottingLossesResponse): EquipmentMarker[] {
  return losses.losses
    .filter((loss) => loss.geo?.includes(","))
    .map((loss) => {
      const [lat, lng] = loss.geo!.split(",").map(Number);
      return {
        id: loss.id,
        type: loss.type,
        model: loss.model,
        status: loss.status,
        date: loss.date,
        location: loss.nearest_location,
        lat,
        lng,
      };
    })
    .filter((m) => !Number.isNaN(m.lat) && !Number.isNaN(m.lng));
}
