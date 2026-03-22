export interface Dam {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: "operational" | "damaged" | "destroyed";
  capacityMW?: number;
  warContext: string;
}

export interface Bridge {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: "operational" | "damaged" | "destroyed";
  strategicValue: string;
  warContext: string;
}

export interface Port {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: "operational" | "limited" | "occupied" | "destroyed";
  portType: "sea" | "river";
  warContext: string;
}

export type InfrastructureItem =
  | (Dam & { category: "dam" })
  | (Bridge & { category: "bridge" })
  | (Port & { category: "port" });

// ── Dams ─────────────────────────────────────────────────────────────

export const DAMS: Dam[] = [
  {
    id: "kakhovka-dam",
    name: "Kakhovka Dam",
    lat: 46.767,
    lng: 33.376,
    status: "destroyed",
    capacityMW: 357,
    warContext:
      "Destroyed on June 6, 2023, causing catastrophic flooding along " +
      "the lower Dnipro. The breach drained the Kakhovka reservoir, " +
      "displaced tens of thousands of people, devastated agriculture, " +
      "and threatened cooling water supply to the Zaporizhzhia NPP.",
  },
  {
    id: "dniprohes-dam",
    name: "DniproHES (Zaporizhzhia)",
    lat: 47.862,
    lng: 35.084,
    status: "damaged",
    capacityMW: 1569,
    warContext:
      "Repeatedly targeted by strikes throughout the war. The dam " +
      "serves as a critical crossing point over the Dnipro at " +
      "Zaporizhzhia city. Damage to the hydroelectric station has " +
      "reduced power generation capacity.",
  },
  {
    id: "kremenchuk-dam",
    name: "Kremenchuk Reservoir Dam",
    lat: 49.078,
    lng: 33.414,
    status: "operational",
    warContext:
      "One of the largest reservoirs on the Dnipro. Remains operational " +
      "but is a potential strategic target due to its role in water " +
      "management and power generation for central Ukraine.",
  },
  {
    id: "kaniv-dam",
    name: "Kaniv Dam",
    lat: 49.752,
    lng: 31.461,
    status: "operational",
    warContext:
      "Located upstream from Kyiv on the Dnipro. Its destruction would " +
      "pose severe downstream flooding risks to the capital region.",
  },
  {
    id: "kyiv-hpp",
    name: "Kyiv HPP (Vyshhorod)",
    lat: 50.587,
    lng: 30.5,
    status: "operational",
    warContext:
      "Critical to Kyiv's water supply and power grid. Located near " +
      "Vyshhorod, just north of Kyiv. Remained under Ukrainian control " +
      "throughout the war despite proximity to the early northern front.",
  },
  {
    id: "kamianske-dam",
    name: "Kamianske Dam",
    lat: 48.517,
    lng: 34.618,
    status: "operational",
    warContext:
      "Situated in the Dnipropetrovsk Oblast industrial zone. Supports " +
      "water supply for heavy industry in the Kamianske-Dnipro corridor.",
  },
];

// ── Bridges ──────────────────────────────────────────────────────────

export const BRIDGES: Bridge[] = [
  {
    id: "kerch-bridge",
    name: "Crimean (Kerch) Bridge",
    lat: 45.314,
    lng: 36.517,
    status: "damaged",
    strategicValue:
      "Russia's sole road and rail link connecting occupied Crimea to " + "the Russian mainland.",
    warContext:
      "Struck by Ukrainian operations in October 2022 and July 2023, " +
      "causing significant damage to both road and rail spans. Repairs " +
      "have partially restored traffic, but the bridge remains a high-" +
      "value strategic target.",
  },
  {
    id: "antonivskyi-bridge",
    name: "Antonivskyi Bridge (Kherson)",
    lat: 46.631,
    lng: 32.707,
    status: "destroyed",
    strategicValue:
      "Key Dnipro River crossing connecting Kherson city to the " +
      "southern bank. Essential for military logistics and civilian " +
      "movement in the region.",
    warContext:
      "Destroyed in November 2022 during the battle for Kherson. " +
      "Ukrainian strikes on the bridge cut Russian supply lines to " +
      "the western bank, contributing to Russia's withdrawal from " +
      "Kherson city.",
  },
  {
    id: "dniprohes-bridge",
    name: "DniproHES Bridge",
    lat: 47.862,
    lng: 35.084,
    status: "damaged",
    strategicValue:
      "Primary Dnipro crossing at Zaporizhzhia city, linking the " +
      "northern and southern halves of the metropolitan area.",
    warContext:
      "Damaged by repeated strikes alongside the DniproHES dam. " +
      "Remains a critical but vulnerable crossing point in the " +
      "Zaporizhzhia sector.",
  },
  {
    id: "zatoka-bridge",
    name: "Zatoka Bridge (Odesa)",
    lat: 46.09,
    lng: 30.458,
    status: "damaged",
    strategicValue:
      "Road and rail bridge connecting Odesa to the western Black Sea " +
      "coastline, providing access to the Danube ports.",
    warContext:
      "Repeatedly targeted by Russian missile strikes and subsequently " +
      "repaired. The bridge is a key link for western Black Sea access " +
      "and alternative grain export routes via the Danube.",
  },
];

// ── Ports ────────────────────────────────────────────────────────────

export const PORTS: Port[] = [
  {
    id: "odesa-port",
    name: "Odesa",
    lat: 46.488,
    lng: 30.746,
    status: "operational",
    portType: "sea",
    warContext:
      "Ukraine's primary grain export hub. Operates under periodic " +
      "Russian missile and drone attacks. Central to the Black Sea " +
      "Grain Initiative and subsequent Ukrainian grain corridor.",
  },
  {
    id: "chornomorsk-port",
    name: "Chornomorsk",
    lat: 46.3,
    lng: 30.655,
    status: "operational",
    portType: "sea",
    warContext:
      "Major grain corridor port near Odesa. Handles significant " +
      "export volumes as part of Ukraine's wartime maritime logistics.",
  },
  {
    id: "pivdennyi-port",
    name: "Pivdennyi (Yuzhne)",
    lat: 46.626,
    lng: 31.004,
    status: "operational",
    portType: "sea",
    warContext:
      "One of Ukraine's largest cargo ports by throughput. Continues " +
      "to operate despite the threat of Russian strikes on port " +
      "infrastructure in the Odesa region.",
  },
  {
    id: "mykolaiv-port",
    name: "Mykolaiv",
    lat: 46.961,
    lng: 31.99,
    status: "limited",
    portType: "river",
    warContext:
      "Operations severely limited due to proximity to the front lines " +
      "and ongoing Russian shelling of Mykolaiv city. The port's river " +
      "access to the Black Sea is constrained by the security situation.",
  },
  {
    id: "mariupol-port",
    name: "Mariupol",
    lat: 47.095,
    lng: 37.549,
    status: "occupied",
    portType: "sea",
    warContext:
      "Occupied by Russia after the siege of Mariupol in spring 2022. " +
      "Port infrastructure was heavily damaged during the battle. The " +
      "city and port remain under Russian occupation.",
  },
  {
    id: "berdyansk-port",
    name: "Berdyansk",
    lat: 46.756,
    lng: 36.794,
    status: "occupied",
    portType: "sea",
    warContext:
      "Occupied by Russian forces since the early days of the invasion. " +
      "Used by Russia for limited military and logistics purposes in " +
      "the Sea of Azov.",
  },
  {
    id: "sevastopol-port",
    name: "Sevastopol",
    lat: 44.616,
    lng: 33.525,
    status: "occupied",
    portType: "sea",
    warContext:
      "Home to Russia's Black Sea Fleet headquarters since the 2014 " +
      "annexation of Crimea. Targeted by Ukrainian naval drones and " +
      "missiles, forcing partial relocation of fleet assets.",
  },
  {
    id: "reni-port",
    name: "Reni (Danube)",
    lat: 45.453,
    lng: 28.273,
    status: "operational",
    portType: "river",
    warContext:
      "Alternative grain export route via the Danube River. Gained " +
      "strategic importance after the collapse of the Black Sea Grain " +
      "Initiative, enabling Ukrainian exports through Romanian waters.",
  },
  {
    id: "izmail-port",
    name: "Izmail (Danube)",
    lat: 45.349,
    lng: 28.843,
    status: "operational",
    portType: "river",
    warContext:
      "Major Danube port that became a critical alternative export " +
      "route. Targeted by Russian strikes in 2023 as grain shipments " +
      "shifted to the Danube corridor.",
  },
];

// ── Combined infrastructure ──────────────────────────────────────────

export const ALL_INFRASTRUCTURE: InfrastructureItem[] = [
  ...DAMS.map((d) => ({ ...d, category: "dam" as const })),
  ...BRIDGES.map((b) => ({ ...b, category: "bridge" as const })),
  ...PORTS.map((p) => ({ ...p, category: "port" as const })),
];
