/**
 * Pre-invasion Russian military buildup data (March 2021 – February 2022).
 *
 * Curated from open-source intelligence including:
 *  - Wikipedia Order of Battle for the 2022 Russian invasion of Ukraine
 *  - Wikipedia "Prelude to the 2022 Russian invasion of Ukraine"
 *  - CSIS "Russia's Possible Invasion of Ukraine" (Jan 2022)
 *  - Zapad 2021 exercise documentation
 *  - IISS Military Balance 2022
 *
 * Troop/equipment numbers are consensus OSINT estimates, not verified counts.
 */

export interface ForceGrouping {
  id: string;
  name: string;
  role: string;
  lat: number;
  lng: number;
  locations: string[];
  /** YYYYMMDD — when this grouping first appeared at this location */
  startDate: string;
  /** YYYYMMDD — when forces withdrew or invasion began */
  endDate?: string;
  estimatedTroops: number;
  btgs: number;
  equipment: {
    tanks?: number;
    ifvs?: number;
    artillery?: number;
    mlrs?: number;
    aircraft?: number;
    helicopters?: number;
    ships?: number;
    iskander?: boolean;
    s400?: boolean;
  };
  units: string[];
  phase: "phase1" | "zapad2021" | "phase2";
  side: "russia";
}

/**
 * Phase 1 — Initial buildup (March–April 2021)
 *
 * ~28 BTGs, 40,000–60,000 troops deployed to Crimea, Rostov,
 * Bryansk, and Voronezh oblasts. Partially withdrawn by June 2021
 * but infrastructure/equipment left in place.
 */
const PHASE1_GROUPINGS: ForceGrouping[] = [
  {
    id: "p1-crimea",
    name: "Crimea Buildup",
    role: "Southern staging and naval reinforcement",
    lat: 45.35,
    lng: 34.0,
    locations: ["Dzhankoi", "Sevastopol", "Feodosia", "Saki"],
    startDate: "20210303",
    endDate: "20210601",
    estimatedTroops: 15000,
    btgs: 8,
    equipment: {
      tanks: 120,
      ifvs: 200,
      artillery: 80,
      aircraft: 20,
      helicopters: 15,
      ships: 6,
    },
    units: ["22nd Army Corps", "810th Naval Infantry Brigade", "Black Sea Fleet"],
    phase: "phase1",
    side: "russia",
  },
  {
    id: "p1-rostov",
    name: "Rostov Staging",
    role: "Donbas reinforcement and eastern staging",
    lat: 47.24,
    lng: 39.72,
    locations: ["Rostov-on-Don", "Kamensk-Shakhtinsky"],
    startDate: "20210315",
    endDate: "20210601",
    estimatedTroops: 10000,
    btgs: 6,
    equipment: {
      tanks: 60,
      ifvs: 100,
      artillery: 50,
      iskander: true,
    },
    units: ["8th Guards Combined Arms Army", "150th Motor Rifle Division"],
    phase: "phase1",
    side: "russia",
  },
  {
    id: "p1-voronezh",
    name: "Voronezh Concentration",
    role: "Central staging for potential Kharkiv axis",
    lat: 51.07,
    lng: 39.18,
    locations: ["Voronezh", "Pogonovo", "Boguchar"],
    startDate: "20210320",
    endDate: "20210601",
    estimatedTroops: 12000,
    btgs: 7,
    equipment: {
      tanks: 80,
      ifvs: 150,
      artillery: 60,
      helicopters: 10,
    },
    units: ["20th Guards Combined Arms Army"],
    phase: "phase1",
    side: "russia",
  },
  {
    id: "p1-bryansk",
    name: "Bryansk Staging",
    role: "Northern approach toward Chernihiv/Sumy",
    lat: 52.75,
    lng: 33.37,
    locations: ["Klimovo", "Klintsy", "Pochep"],
    startDate: "20210320",
    endDate: "20210601",
    estimatedTroops: 8000,
    btgs: 5,
    equipment: {
      tanks: 50,
      ifvs: 80,
      artillery: 40,
    },
    units: ["41st Combined Arms Army (elements)"],
    phase: "phase1",
    side: "russia",
  },
  {
    id: "p1-yelnya",
    name: "Yelnya Garrison Buildup",
    role: "Strategic reserve and satellite-confirmed concentration",
    lat: 54.57,
    lng: 33.18,
    locations: ["Yelnya"],
    startDate: "20210310",
    endDate: "20210601",
    estimatedTroops: 5000,
    btgs: 2,
    equipment: {
      tanks: 40,
      ifvs: 60,
      artillery: 30,
    },
    units: ["41st Combined Arms Army (elements)", "Central Military District reserve"],
    phase: "phase1",
    side: "russia",
  },
];

/**
 * Zapad 2021 Exercise (September 10–15, 2021)
 *
 * 200,000 military personnel, 760 equipment pieces (290 tanks,
 * 240 artillery/MLRS, 80+ aircraft), 15 ships.
 * Conducted at 14 training grounds in Russia and Belarus.
 * US intelligence later assessed this as rehearsal for invasion.
 */
const ZAPAD2021_GROUPINGS: ForceGrouping[] = [
  {
    id: "z21-mulino",
    name: "Zapad 2021 — Mulino",
    role: "Primary exercise site, opening/closing ceremony",
    lat: 56.12,
    lng: 43.2,
    locations: ["Mulino"],
    startDate: "20210910",
    endDate: "20210915",
    estimatedTroops: 30000,
    btgs: 15,
    equipment: {
      tanks: 60,
      ifvs: 100,
      artillery: 50,
      aircraft: 20,
      helicopters: 15,
    },
    units: ["Multiple formations from Western and Central Military Districts"],
    phase: "zapad2021",
    side: "russia",
  },
  {
    id: "z21-pogonovo",
    name: "Zapad 2021 — Pogonovo",
    role: "Combined arms training near Ukraine border",
    lat: 51.49,
    lng: 39.27,
    locations: ["Pogonovo"],
    startDate: "20210910",
    endDate: "20210915",
    estimatedTroops: 20000,
    btgs: 10,
    equipment: {
      tanks: 40,
      ifvs: 80,
      artillery: 35,
    },
    units: ["20th Guards Combined Arms Army"],
    phase: "zapad2021",
    side: "russia",
  },
  {
    id: "z21-obuz-lesnovsky",
    name: "Zapad 2021 — Obuz-Lesnovsky (Belarus)",
    role: "Joint Belarus-Russia exercise site",
    lat: 53.0,
    lng: 26.2,
    locations: ["Obuz-Lesnovsky", "Brest"],
    startDate: "20210910",
    endDate: "20210915",
    estimatedTroops: 15000,
    btgs: 8,
    equipment: {
      tanks: 30,
      ifvs: 50,
      artillery: 25,
      helicopters: 10,
    },
    units: ["Belarusian Armed Forces", "Western Military District formations"],
    phase: "zapad2021",
    side: "russia",
  },
  {
    id: "z21-kaliningrad",
    name: "Zapad 2021 — Kaliningrad",
    role: "Urban warfare and robotic systems testing",
    lat: 54.71,
    lng: 20.51,
    locations: ["Pravdinsky", "Dobrovolsky", "Khmelevka"],
    startDate: "20210910",
    endDate: "20210915",
    estimatedTroops: 10000,
    btgs: 5,
    equipment: {
      tanks: 20,
      ifvs: 40,
      artillery: 20,
      ships: 5,
    },
    units: ["Baltic Fleet", "11th Army Corps"],
    phase: "zapad2021",
    side: "russia",
  },
  {
    id: "z21-strugi-krasnye",
    name: "Zapad 2021 — Strugi Krasnye",
    role: "Airborne and air assault exercises",
    lat: 57.83,
    lng: 29.85,
    locations: ["Strugi Krasnye", "Kirillovsky"],
    startDate: "20210910",
    endDate: "20210915",
    estimatedTroops: 12000,
    btgs: 6,
    equipment: {
      aircraft: 15,
      helicopters: 10,
    },
    units: ["76th Guards Air Assault Division", "VDV formations"],
    phase: "zapad2021",
    side: "russia",
  },
];

/**
 * Phase 2 — Final buildup (October 2021 – February 24, 2022)
 *
 * 9 force groupings from Yuri Butusov / Wikipedia Order of Battle.
 * Progressive escalation: 100K (Dec) → 130K (Jan) → 175–190K (Feb).
 * These are the invasion launch positions.
 */
const PHASE2_GROUPINGS: ForceGrouping[] = [
  {
    id: "p2-sw-belarus",
    name: "Southwestern Belarus Group",
    role: "Blocking contingent against Ukrainian forces in western Ukraine",
    lat: 52.1,
    lng: 25.0,
    locations: ["Brest", "Luninyets", "Baranavichy", "Asipovichy", "Minsk"],
    startDate: "20220224",
    endDate: "20220406",
    estimatedTroops: 8000,
    btgs: 7,
    equipment: {
      tanks: 50,
      ifvs: 80,
      artillery: 30,
      helicopters: 8,
    },
    units: [
      "200th Arctic Motor Rifle Brigade (Northern Fleet)",
      "61st Naval Infantry Brigade (Northern Fleet)",
      "76th Guards Air Assault Division (VDV)",
      "98th Guards Airborne Division (VDV)",
    ],
    phase: "phase2",
    side: "russia",
  },
  {
    id: "p2-se-belarus",
    name: "Southeastern Belarus Group",
    role: "Kyiv offensive direction — main thrust toward capital",
    lat: 52.05,
    lng: 29.25,
    locations: ["Brahin", "Rechytsa", "Mazyr", "Vepri", "Khainini"],
    startDate: "20220224",
    endDate: "20220406",
    estimatedTroops: 12000,
    btgs: 8,
    equipment: {
      tanks: 80,
      ifvs: 140,
      artillery: 50,
      mlrs: 15,
      helicopters: 12,
    },
    units: ["5th Combined Arms Army", "35th Combined Arms Army", "36th Combined Arms Army"],
    phase: "phase2",
    side: "russia",
  },
  {
    id: "p2-bryansk",
    name: "Bryansk Group",
    role: "Chernihiv offensive direction",
    lat: 52.55,
    lng: 32.72,
    locations: ["Klimovo", "Klintsy", "Pochep", "Sevsk"],
    startDate: "20220224",
    endDate: "20220406",
    estimatedTroops: 5000,
    btgs: 3,
    equipment: {
      tanks: 30,
      ifvs: 50,
      artillery: 25,
    },
    units: ["41st Guards Combined Arms Army (elements)", "90th Guards Tank Division"],
    phase: "phase2",
    side: "russia",
  },
  {
    id: "p2-kursk-belgorod",
    name: "Kursk–Belgorod Group",
    role: "Sumy offensive direction",
    lat: 51.0,
    lng: 36.2,
    locations: ["Tomarovka", "Vesela Lopan", "Zorino", "Kursk", "Belgorod"],
    startDate: "20220224",
    endDate: "20220514",
    estimatedTroops: 6000,
    btgs: 4,
    equipment: {
      tanks: 40,
      ifvs: 60,
      artillery: 30,
      iskander: true,
    },
    units: ["6th Combined Arms Army", "20th Guards Combined Arms Army (elements)"],
    phase: "phase2",
    side: "russia",
  },
  {
    id: "p2-voronezh",
    name: "Voronezh Group",
    role: "Kharkiv offensive direction — largest grouping",
    lat: 50.75,
    lng: 38.9,
    locations: ["Stary Oskol", "Soloti", "Valuyki", "Boguchar", "Pogonovo", "Voronezh"],
    startDate: "20220224",
    endDate: "20220514",
    estimatedTroops: 20000,
    btgs: 14,
    equipment: {
      tanks: 140,
      ifvs: 240,
      artillery: 100,
      mlrs: 30,
      helicopters: 15,
      iskander: true,
      s400: true,
    },
    units: [
      "1st Guards Tank Army",
      "6th Combined Arms Army (elements)",
      "20th Guards Combined Arms Army",
    ],
    phase: "phase2",
    side: "russia",
  },
  {
    id: "p2-yelnya",
    name: "Smolensk/Yelnya Reserve",
    role: "Operational reserve of the northern front",
    lat: 54.57,
    lng: 33.18,
    locations: ["Yelnya"],
    startDate: "20220224",
    endDate: "20220406",
    estimatedTroops: 9000,
    btgs: 7,
    equipment: {
      tanks: 60,
      ifvs: 100,
      artillery: 40,
      mlrs: 12,
    },
    units: ["20th Guards Combined Arms Army (reserve)", "41st Guards Combined Arms Army (reserve)"],
    phase: "phase2",
    side: "russia",
  },
  {
    id: "p2-rostov",
    name: "Rostov Group",
    role: "Donbas and eastern Sea of Azov offensive direction",
    lat: 47.45,
    lng: 40.1,
    locations: ["Rostov-on-Don", "Kamensk-Shakhtinsky"],
    startDate: "20220224",
    endDate: "20220520",
    estimatedTroops: 8000,
    btgs: 6,
    equipment: {
      tanks: 50,
      ifvs: 90,
      artillery: 40,
      mlrs: 10,
      iskander: true,
    },
    units: ["8th Guards Combined Arms Army"],
    phase: "phase2",
    side: "russia",
  },
  {
    id: "p2-crimea",
    name: "Crimea Group",
    role: "Southern Ukraine offensive direction — largest southern grouping",
    lat: 45.3,
    lng: 34.1,
    locations: [
      "Slavne",
      "Dzhankoi",
      "Novoozerne",
      "Yevpatoria",
      "Sevastopol",
      "Bakhchysarai",
      "Feodosia",
    ],
    startDate: "20220224",
    endDate: "20220325",
    estimatedTroops: 18000,
    btgs: 13,
    equipment: {
      tanks: 100,
      ifvs: 180,
      artillery: 70,
      mlrs: 20,
      aircraft: 30,
      helicopters: 20,
      ships: 12,
      iskander: true,
      s400: true,
    },
    units: [
      "58th Guards Combined Arms Army",
      "22nd Army Corps (Black Sea Fleet)",
      "810th Guards Naval Infantry Brigade",
      "Black Sea Fleet",
    ],
    phase: "phase2",
    side: "russia",
  },
  {
    id: "p2-kuban",
    name: "Kuban Reserve",
    role: "Operational reserve of the southern front",
    lat: 45.04,
    lng: 38.98,
    locations: ["Novorossiysk", "Korenovsk", "Primorsko-Akhtarsk", "Krasnodar", "Maykop"],
    startDate: "20220224",
    endDate: "20220520",
    estimatedTroops: 8000,
    btgs: 6,
    equipment: {
      tanks: 50,
      ifvs: 80,
      artillery: 35,
      helicopters: 10,
    },
    units: [
      "49th Combined Arms Army",
      "7th Guards Mountain Air Assault Division (VDV)",
      "22nd Army Corps (elements)",
    ],
    phase: "phase2",
    side: "russia",
  },
];

/**
 * Combined export of all mobilization data.
 */
export const MOBILIZATION_GROUPINGS: ForceGrouping[] = [...PHASE2_GROUPINGS];

/**
 * Aggregate invasion force estimates (Phase 2 totals only).
 */
export const INVASION_FORCE_TOTALS = {
  troops: 190000,
  btgs: 68,
  tanks: 1200,
  ifvs: 2400,
  artillery: 1500,
  mlrs: 300,
  aircraft: 300,
  helicopters: 200,
  ships: 50,
} as const;

/**
 * Timeline milestones for the buildup period.
 */
export const BUILDUP_MILESTONES = [
  { date: "20210303", label: "40K", description: "First buildup begins: ~40,000 troops deployed" },
  {
    date: "20210601",
    label: "Partial withdrawal",
    description: "Troops partially withdrawn; equipment left in place",
  },
  {
    date: "20210910",
    label: "Zapad 2021",
    description: "200,000 troops in joint Russia-Belarus exercise",
  },
  {
    date: "20211026",
    label: "Renewed buildup",
    description: "Second buildup begins with larger forces",
  },
  {
    date: "20211201",
    label: "100K",
    description: "Estimated 100,000 troops massed on three sides",
  },
  { date: "20220115", label: "130K", description: "Force buildup reaches ~130,000 troops" },
  {
    date: "20220210",
    label: "175K+",
    description: "Final positioning: 175,000–190,000 troops at launch positions",
  },
  {
    date: "20220224",
    label: "Invasion",
    description: "Full-scale invasion begins at 03:40 (UTC+2)",
  },
] as const;

/**
 * Planned invasion axes — major axes of advance from staging areas toward objectives.
 * Visible on the map when timeline is near late January–February 2022.
 * Coordinates trace the approximate advance routes from CSIS analysis.
 */
export interface InvasionRoute {
  id: string;
  name: string;
  description: string;
  /** When this route becomes visible (YYYYMMDD) */
  visibleFrom: string;
  /** Route waypoints as [lng, lat] pairs from origin to objective */
  coordinates: [number, number][];
  color: string;
}

export const INVASION_ROUTES: InvasionRoute[] = [
  {
    id: "northern-kyiv",
    name: "Northern Axis — Kyiv",
    description:
      "From Belarus through Chernobyl exclusion zone toward Kyiv — the primary decapitation thrust",
    visibleFrom: "20220210",
    coordinates: [
      [29.25, 52.05], // SE Belarus (Mazyr staging)
      [30.1, 51.39], // Chernobyl exclusion zone
      [30.32, 50.95], // Hostomel / Bucha approach
      [30.52, 50.45], // Kyiv
    ],
    color: "#ef4444",
  },
  {
    id: "northeast-sumy-kharkiv",
    name: "Northeast Axis — Sumy/Kharkiv",
    description:
      "From Kursk-Belgorod through Sumy and toward Kharkiv — splitting Ukrainian forces in the northeast",
    visibleFrom: "20220210",
    coordinates: [
      [36.59, 51.73], // Kursk
      [35.88, 51.15], // Sumy approach
      [36.23, 49.99], // Kharkiv
    ],
    color: "#ef4444",
  },
  {
    id: "eastern-donbas",
    name: "Eastern Axis — Donbas",
    description: "From Rostov and existing separatist territory toward Mariupol and western Donbas",
    visibleFrom: "20220210",
    coordinates: [
      [39.72, 47.24], // Rostov-on-Don
      [38.5, 47.5], // Border crossing
      [37.6, 47.1], // Mariupol approach
    ],
    color: "#ef4444",
  },
  {
    id: "southern-crimea",
    name: "Southern Axis — Crimea",
    description:
      "From Crimea northward toward Kherson and Nova Kakhovka — establishing a land bridge to Donbas",
    visibleFrom: "20220210",
    coordinates: [
      [34.1, 45.35], // Dzhankoi (Crimea staging)
      [33.37, 46.64], // Kherson
      [33.37, 46.76], // Nova Kakhovka
      [35.14, 47.1], // Toward Zaporizhzhia
    ],
    color: "#ef4444",
  },
];
