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

export interface Substation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  voltageKV: number;
  status: "operational" | "damaged" | "destroyed";
  warContext: string;
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
  {
    id: "russkaya-compressor",
    name: "Russkaya Compressor Station",
    lat: 44.6,
    lng: 37.83,
    stationType: "compressor",
    status: "operational",
    description:
      "Russian-side compressor station near Anapa feeding TurkStream. " +
      "Entry point for gas traveling through the subsea Black Sea pipeline to Turkey.",
  },
  {
    id: "kiyikoy-landing",
    name: "Kıyıköy Landing Point",
    lat: 41.64,
    lng: 28.1,
    stationType: "exit",
    status: "operational",
    description:
      "Turkish receiving terminal at Kıyıköy on the Black Sea coast. " +
      "Exit point for TurkStream gas entering Turkey's pipeline network.",
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
      {
        date: "20240828",
        status: "damaged",
        note: "Further damage in August 2024 strike wave",
      },
      {
        date: "20241119",
        status: "damaged",
        note: "Hit again in winter 2024-2025 campaign",
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
      {
        date: "20231012",
        status: "damaged",
        note: "Further damage in second winter campaign (Oct 2023)",
      },
      {
        date: "20240322",
        status: "damaged",
        note: "Spring 2024 energy campaign strikes",
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
    status: "destroyed",
    warContext:
      "Located near Kharkiv, heavily damaged by repeated Russian " +
      "strikes. Key target in the systematic campaign to degrade " +
      "Ukraine's thermal generation capacity.",
    statusHistory: [
      { date: "20220312", status: "damaged", note: "Damaged during early fighting near Kharkiv" },
      {
        date: "20221010",
        status: "damaged",
        note: "Further damage in October 2022 energy strikes",
      },
      { date: "20240322", status: "damaged", note: "Severely damaged in spring 2024 strikes" },
      {
        date: "20240901",
        status: "destroyed",
        note: "Effectively destroyed after cumulative strike damage",
      },
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
  {
    id: "kurakhove-tpp",
    name: "Kurakhove TPP",
    lat: 47.993,
    lng: 37.294,
    plantType: "thermal",
    capacityMW: 1460,
    status: "destroyed",
    warContext:
      "Located in Donetsk Oblast near the front line. Suffered progressive " +
      "damage from shelling throughout the war and was effectively destroyed " +
      "as fighting reached the area in late 2024.",
    statusHistory: [
      { date: "20220501", status: "damaged", note: "Damaged by shelling near Donetsk front" },
      { date: "20231015", status: "damaged", note: "Further damage from proximity to front line" },
      { date: "20241201", status: "destroyed", note: "Destroyed as front line reached Kurakhove" },
    ],
  },
  {
    id: "vuhlehirska-tpp",
    name: "Vuhlehirska TPP",
    lat: 48.321,
    lng: 38.098,
    plantType: "thermal",
    capacityMW: 3600,
    status: "occupied",
    warContext:
      "One of Ukraine's largest thermal plants. Occupied by Russian " +
      "forces in July 2022 during the Donbas offensive. Sustained " +
      "significant damage during fighting.",
    statusHistory: [
      { date: "20220601", status: "damaged", note: "Damaged in fighting around Svitlodarsk" },
      { date: "20220727", status: "occupied", note: "Occupied by Russian forces" },
    ],
  },
  {
    id: "kryvorizka-tpp",
    name: "Kryvorizka TPP",
    lat: 47.934,
    lng: 33.413,
    plantType: "thermal",
    capacityMW: 2820,
    status: "damaged",
    warContext:
      "Major thermal plant in Dnipropetrovsk Oblast. Repeatedly " +
      "targeted by Russian missile and drone strikes as part of the " +
      "systematic campaign against energy infrastructure.",
    statusHistory: [
      { date: "20221010", status: "damaged", note: "Damaged in October 2022 energy strikes" },
      { date: "20240322", status: "damaged", note: "Further damage in spring 2024 strikes" },
    ],
  },
  {
    id: "zaporizka-tpp",
    name: "Zaporizka TPP",
    lat: 47.662,
    lng: 34.574,
    plantType: "thermal",
    capacityMW: 3600,
    status: "damaged",
    warContext:
      "Located in Zaporizhzhia Oblast, one of the largest thermal " +
      "plants in Europe. Sustained damage from Russian strikes " +
      "targeting energy infrastructure across southern Ukraine.",
    statusHistory: [
      { date: "20221010", status: "damaged", note: "Damaged in October 2022 energy campaign" },
      { date: "20240322", status: "damaged", note: "Further damage in spring 2024 strikes" },
    ],
  },
];

// ── Combined Export ────────────────────────────────────────────────────

// ── Key Substations ────────────────────────────────────────────────────

/**
 * High-voltage substations targeted in Russia's systematic campaign
 * against Ukraine's electricity transmission network (2022-2025).
 */
export const SUBSTATIONS: Substation[] = [
  {
    id: "substation-kharkiv-north",
    name: "Kharkiv Northern 330kV Substation",
    lat: 50.05,
    lng: 36.25,
    voltageKV: 330,
    status: "damaged",
    warContext:
      "Repeatedly struck as part of targeted attacks on Kharkiv's " +
      "power supply, causing prolonged blackouts across the region.",
    statusHistory: [
      { date: "20221010", status: "damaged", note: "Hit in October 2022 energy campaign" },
      { date: "20230115", status: "damaged", note: "Struck again in winter 2022-2023 wave" },
      { date: "20240322", status: "damaged", note: "Targeted in spring 2024 campaign" },
    ],
  },
  {
    id: "substation-odesa-main",
    name: "Odesa Main 330kV Substation",
    lat: 46.47,
    lng: 30.73,
    voltageKV: 330,
    status: "damaged",
    warContext:
      "Key hub for power distribution in the Odesa region. Targeted " +
      "repeatedly, causing widespread blackouts in southern Ukraine.",
    statusHistory: [
      { date: "20221010", status: "damaged", note: "Hit in October 2022 campaign" },
      { date: "20231201", status: "damaged", note: "Struck in December 2023 attacks" },
      { date: "20240828", status: "damaged", note: "Damaged again in August 2024 strikes" },
    ],
  },
  {
    id: "substation-dnipro-750",
    name: "Dnipro 750kV Substation",
    lat: 48.47,
    lng: 35.04,
    voltageKV: 750,
    status: "damaged",
    warContext:
      "Critical backbone substation in the 750kV transmission " +
      "network. Damage here disrupts power flows across central " +
      "and eastern Ukraine.",
    statusHistory: [
      { date: "20221010", status: "damaged", note: "Hit in October 2022 energy campaign" },
      { date: "20240322", status: "damaged", note: "Targeted in spring 2024 strikes" },
      { date: "20241119", status: "damaged", note: "Further strikes in winter 2024-2025 campaign" },
    ],
  },
  {
    id: "substation-kyiv-west",
    name: "Kyiv Western 330kV Substation",
    lat: 50.41,
    lng: 30.35,
    voltageKV: 330,
    status: "damaged",
    warContext:
      "Serves western Kyiv and surrounding suburbs. Part of the " +
      "Kyiv metro area power grid targeted in winter strike campaigns.",
    statusHistory: [
      { date: "20221010", status: "damaged", note: "Damaged in October 2022 strikes" },
      { date: "20231201", status: "damaged", note: "Struck during winter 2023-2024 campaign" },
      { date: "20241119", status: "damaged", note: "Hit in winter 2024-2025 campaign" },
    ],
  },
  {
    id: "substation-zaporizhzhia-main",
    name: "Zaporizhzhia Central 330kV Substation",
    lat: 47.84,
    lng: 35.14,
    voltageKV: 330,
    status: "damaged",
    warContext:
      "Key distribution point for the Zaporizhzhia region. " +
      "Repeatedly targeted alongside the DniproHES and thermal plants.",
    statusHistory: [
      { date: "20220301", status: "damaged", note: "Damaged during early fighting" },
      { date: "20240322", status: "damaged", note: "Struck in spring 2024 energy campaign" },
    ],
  },
  {
    id: "substation-vinnytsia-750",
    name: "Vinnytsia 750kV Substation",
    lat: 49.23,
    lng: 28.47,
    voltageKV: 750,
    status: "damaged",
    warContext:
      "Part of the 750kV backbone connecting western Ukraine to " +
      "the central grid. Damage disrupts EU interconnection capacity.",
    statusHistory: [
      { date: "20231012", status: "damaged", note: "Struck in October 2023 campaign" },
      { date: "20240322", status: "damaged", note: "Targeted in spring 2024 strikes" },
    ],
  },
];

/**
 * Convenience aggregate of all energy-infrastructure datasets.
 */
export const ALL_ENERGY_ASSETS = {
  pipelines: GAS_PIPELINES,
  stations: GAS_STATIONS,
  powerPlants: POWER_PLANTS,
  substations: SUBSTATIONS,
} as const;
