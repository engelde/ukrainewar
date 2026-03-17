export interface CasualtyData {
  day: number;
  militaryPersonnel: [number, number]; // [daily, cumulative]
  jet: [number, number];
  copter: [number, number];
  tank: [number, number];
  armoredCombatVehicle: [number, number];
  artillerySystem: [number, number];
  airDefenceSystem: [number, number];
  mlrs: [number, number];
  supplyVehicle: [number, number];
  ship: [number, number];
  uav: [number, number];
  _meta: {
    last_updated: string;
    days: number[];
    last: string;
  };
}

export interface WarSpottingStats {
  counts_by_status: {
    abandoned: number;
    captured: number;
    destroyed: number;
    damaged: number;
  };
  counts_by_type: Array<{
    type_name: string;
    counts: {
      losses: string;
      losses_new: string;
      damaged: string;
      damaged_new: string;
    };
  }>;
}

export interface WarSpottingLoss {
  id: number;
  type: string;
  model: string;
  status: string;
  lost_by: string;
  date: string;
  nearest_location: string | null;
  geo: string | null;
  unit: string | null;
  tags: string | null;
}

export interface WarSpottingLossesResponse {
  losses: WarSpottingLoss[];
}

export interface StatItem {
  key: string;
  label: string;
  daily: number;
  total: number;
  icon: string;
}

export interface TerritoryResponse {
  date: string;
  geojson: GeoJSON.FeatureCollection;
}

export interface EquipmentMarker {
  id: number;
  type: string;
  model: string;
  status: "destroyed" | "damaged" | "captured" | "abandoned" | string;
  date: string;
  location: string | null;
  lng: number;
  lat: number;
}

export interface MapLayers {
  territory: boolean;
  equipment: boolean;
  frontline: boolean;
  border: boolean;
}

export type EquipmentStatus = "destroyed" | "damaged" | "captured" | "abandoned";
