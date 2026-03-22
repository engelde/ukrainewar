export interface NuclearPlant {
  id: string;
  name: string;
  officialName: string;
  lat: number;
  lng: number;
  reactors: number;
  reactorType: string;
  capacityMW: number;
  status: "operational" | "shutdown" | "occupied" | "decommissioned";
  occupiedBy?: "russia";
  iaeaPresence: boolean;
  warContext: string;
  description: string;
}

/**
 * All Ukrainian nuclear power plants, including war-affected status.
 */
export const NUCLEAR_PLANTS: NuclearPlant[] = [
  // ── Occupied / Shutdown ────────────────────────────────────────────

  {
    id: "zaporizhzhia-npp",
    name: "Zaporizhzhia NPP",
    officialName: "Zaporizka Atomna Elektrychna Stantsiia",
    lat: 47.512,
    lng: 34.586,
    reactors: 6,
    reactorType: "VVER-1000",
    capacityMW: 5700,
    status: "occupied",
    occupiedBy: "russia",
    iaeaPresence: true,
    warContext:
      "Occupied by Russian forces since March 2022. All six reactors " +
      "are in shutdown. IAEA monitoring mission on-site since September " +
      "2022. Repeated shelling incidents around the plant have raised " +
      "global nuclear safety concerns.",
    description:
      "Europe's largest nuclear power plant by capacity. Located on the " +
      "southern bank of the Kakhovka reservoir on the Dnipro River.",
  },

  // ── Operational plants ─────────────────────────────────────────────

  {
    id: "south-ukraine-npp",
    name: "South Ukraine NPP",
    officialName: "Pivdennoukrainska Atomna Elektrychna Stantsiia",
    lat: 47.813,
    lng: 31.222,
    reactors: 3,
    reactorType: "VVER-1000",
    capacityMW: 3000,
    status: "operational",
    iaeaPresence: false,
    warContext:
      "Approximately 100 km from the front lines. Critical to the " +
      "southern electricity grid and one of the primary baseload sources " +
      "for Ukraine's power system during wartime.",
    description:
      "Located in Mykolaiv Oblast near the town of Yuzhnoukrainsk. " +
      "Supplies a significant share of southern Ukraine's electricity.",
  },

  {
    id: "rivne-npp",
    name: "Rivne NPP",
    officialName: "Rivnenska Atomna Elektrychna Stantsiia",
    lat: 51.338,
    lng: 25.872,
    reactors: 4,
    reactorType: "VVER (2x VVER-440 + 2x VVER-1000)",
    capacityMW: 2835,
    status: "operational",
    iaeaPresence: false,
    warContext:
      "Located in western Ukraine, relatively far from active combat " +
      "zones. Remains a key pillar of the national grid, especially " +
      "after repeated Russian strikes on thermal power infrastructure.",
    description:
      "Situated in Rivne Oblast near the city of Varash. Operates a " +
      "mixed fleet of VVER-440 and VVER-1000 reactors.",
  },

  {
    id: "khmelnytskyi-npp",
    name: "Khmelnytskyi NPP",
    officialName: "Khmelnytska Atomna Elektrychna Stantsiia",
    lat: 50.32,
    lng: 26.645,
    reactors: 2,
    reactorType: "VVER-1000 (+2 under construction)",
    capacityMW: 2000,
    status: "operational",
    iaeaPresence: false,
    warContext:
      "Located in western Ukraine, away from front lines. Two additional " +
      "reactor units are under construction to expand capacity and " +
      "reduce dependence on occupied or vulnerable energy assets.",
    description:
      "Located in Khmelnytskyi Oblast near the city of Netishyn. " +
      "Expansion plans aim to increase Ukraine's nuclear generation " +
      "capacity.",
  },

  // ── Decommissioned ─────────────────────────────────────────────────

  {
    id: "chernobyl-npp",
    name: "Chernobyl NPP",
    officialName: "Chornobylska Atomna Elektrychna Stantsiia",
    lat: 51.389,
    lng: 30.099,
    reactors: 4,
    reactorType: "RBMK-1000 (all decommissioned)",
    capacityMW: 0,
    status: "decommissioned",
    iaeaPresence: true,
    warContext:
      "Briefly occupied by Russian forces from February 24 to March 31, " +
      "2022, during the initial northern offensive. Russian troops dug " +
      "trenches in contaminated soil within the exclusion zone. The " +
      "site was returned to Ukrainian control after Russia's withdrawal " +
      "from the Kyiv axis.",
    description:
      "Site of the 1986 nuclear disaster. All reactors have been " +
      "decommissioned since 2000. The New Safe Confinement structure " +
      "covers reactor 4. The surrounding exclusion zone remains in " +
      "place.",
  },
];
