export interface GasPipeline {
  id: string;
  name: string;
  waypoints: { lat: number; lng: number }[];
  status: "operational" | "shutdown" | "destroyed";
  description: string;
  statusHistory?: import("./infrastructure").StatusChange[];
}

export interface PowerPlant {
  id: string;
  name: string;
  lat: number;
  lng: number;
  plantType: "thermal" | "hydro" | "solar" | "wind";
  capacityMW?: number;
  status: "operational" | "damaged" | "destroyed" | "occupied";
  warContext: string;
  statusHistory?: import("./infrastructure").StatusChange[];
}

export interface GasStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  stationType: "entry" | "exit" | "compressor";
  status: "operational" | "shutdown";
  description: string;
  statusHistory?: import("./infrastructure").StatusChange[];
}

// ── Gas Pipelines ──────────────────────────────────────────────────────

/**
 * Major gas pipeline routes simplified to key waypoints for map rendering.
 */
export const GAS_PIPELINES: GasPipeline[] = [
  {
    id: "russia-ukraine-transit",
    name: "Russia-Ukraine Transit (Sudzha-Uzhhorod)",
    waypoints: [
      { lat: 51.19, lng: 35.27 }, // Sudzha entry (Russia border)
      { lat: 50.75, lng: 33.47 }, // Romny compressor station
      { lat: 49.84, lng: 33.0 }, // Orzhytsia (Poltava region)
      { lat: 49.07, lng: 27.68 }, // Bar (Vinnytsia region)
      { lat: 48.81, lng: 24.54 }, // Bohorodchany (Ivano-Frankivsk)
      { lat: 48.62, lng: 22.3 }, // Uzhhorod (exit to Slovakia)
    ],
    status: "shutdown",
    description:
      "Historic Soviet-era transit pipeline carrying Russian gas to " +
      "Europe via Ukraine. Shut down on 1 January 2025 when Ukraine " +
      "declined to renew the transit agreement, ending decades of gas " +
      "flow through this corridor.",
    statusHistory: [
      {
        date: "20250101",
        status: "shutdown",
        note: "Transit agreement expired; Ukraine declined renewal",
      },
    ],
  },
  {
    id: "turkstream",
    name: "TurkStream",
    waypoints: [
      { lat: 44.6, lng: 37.83 }, // Russkaya compressor station (Anapa coast)
      { lat: 43.1, lng: 33.5 }, // Mid-Black Sea waypoint
      { lat: 41.64, lng: 28.1 }, // Kıyıköy landing (Turkey)
    ],
    status: "operational",
    description:
      "Subsea pipeline from Russia to Turkey across the Black Sea. " +
      "Became Russia's primary southern gas export route after Nord " +
      "Stream was destroyed and Ukraine transit ended.",
  },
];

// ── Gas Metering / Entry-Exit Stations ─────────────────────────────────

/**
 * Key gas metering and entry/exit stations in the transit network.
 */
export const GAS_STATIONS: GasStation[] = [
  {
    id: "sudzha-entry",
    name: "Sudzha Entry Point",
    lat: 51.189,
    lng: 35.271,
    stationType: "entry",
    status: "shutdown",
    description:
      "Russian-side metering station where gas entered the Ukrainian " +
      "transit system. Shut down since January 2025; located in " +
      "Kursk oblast near the Ukrainian incursion zone.",
    statusHistory: [{ date: "20250101", status: "shutdown", note: "Transit agreement expired" }],
  },
  {
    id: "velke-kapusany",
    name: "Velke Kapusany (UA to Slovakia)",
    lat: 48.699,
    lng: 22.212,
    stationType: "exit",
    status: "shutdown",
    description:
      "Exit point on the Ukraine-Slovakia border, historically the " +
      "largest volume metering station in the European transit system. " +
      "Shut down with the end of the transit agreement.",
    statusHistory: [{ date: "20250101", status: "shutdown", note: "Transit agreement expired" }],
  },
  {
    id: "orlivka",
    name: "Orlivka (UA to Romania)",
    lat: 45.473,
    lng: 28.818,
    stationType: "exit",
    status: "shutdown",
    description:
      "Southern exit point on the Ukraine-Romania border. Capable of " +
      "reverse flow; potential future route for non-Russian gas supply " +
      "into Ukraine.",
    statusHistory: [{ date: "20250101", status: "shutdown", note: "Transit agreement expired" }],
  },
];

// ── Major Power Plants ─────────────────────────────────────────────────

/**
 * Major Ukrainian thermal power plants targeted or affected by the war.
 */
export const POWER_PLANTS: PowerPlant[] = [
  {
    id: "trypilska-tpp",
    name: "Trypilska TPP",
    lat: 50.07,
    lng: 30.779,
    plantType: "thermal",
    status: "destroyed",
    warContext:
      "Destroyed in a Russian missile strike in April 2024. Was a " +
      "major electricity supplier to the Kyiv region; its loss " +
      "significantly worsened power shortages.",
    statusHistory: [
      { date: "20240411", status: "destroyed", note: "Destroyed by Russian missile strike" },
    ],
  },
  {
    id: "burshtyn-tpp",
    name: "Burshtyn TPP",
    lat: 49.22,
    lng: 24.634,
    plantType: "thermal",
    capacityMW: 2300,
    status: "damaged",
    warContext:
      "Major thermal power plant in western Ukraine, repeatedly " +
      "targeted by Russian missile and drone strikes. Critical for " +
      "electricity exports to the EU via the Burshtyn energy island.",
    statusHistory: [
      {
        date: "20240322",
        status: "damaged",
        note: "Damaged in spring 2024 energy strikes campaign",
      },
    ],
  },
  {
    id: "ladyzhyn-tpp",
    name: "Ladyzhyn TPP",
    lat: 48.687,
    lng: 29.244,
    plantType: "thermal",
    capacityMW: 1800,
    status: "damaged",
    warContext:
      "Repeatedly targeted in Russia's campaign against Ukrainian " +
      "energy infrastructure, suffering significant damage across " +
      "multiple strike waves.",
    statusHistory: [
      {
        date: "20221010",
        status: "damaged",
        note: "Damaged in Oct 2022 energy infrastructure campaign",
      },
    ],
  },
  {
    id: "zmiiv-tpp",
    name: "Zmiiv TPP",
    lat: 49.654,
    lng: 36.375,
    plantType: "thermal",
    capacityMW: 2175,
    status: "damaged",
    warContext:
      "Located near Kharkiv, heavily damaged by repeated Russian " +
      "strikes. Key target in the systematic campaign to degrade " +
      "Ukraine's thermal generation capacity.",
    statusHistory: [
      { date: "20220312", status: "damaged", note: "Damaged during early fighting near Kharkiv" },
    ],
  },
  {
    id: "slovianska-tpp",
    name: "Slovianska TPP",
    lat: 48.864,
    lng: 37.662,
    plantType: "thermal",
    status: "destroyed",
    warContext:
      "Destroyed early in the war during fighting in the Donetsk " +
      "region. Located near Sloviansk, which saw heavy combat in 2022.",
    statusHistory: [
      { date: "20220601", status: "destroyed", note: "Destroyed during fighting around Sloviansk" },
    ],
  },
];

// ── Combined Export ────────────────────────────────────────────────────

/**
 * Convenience aggregate of all energy-infrastructure datasets.
 */
export const ALL_ENERGY_ASSETS = {
  pipelines: GAS_PIPELINES,
  stations: GAS_STATIONS,
  powerPlants: POWER_PLANTS,
} as const;
