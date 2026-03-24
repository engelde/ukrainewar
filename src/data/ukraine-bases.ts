export interface UkraineBase {
  id: string;
  name: string;
  type: "air_base" | "army_base" | "naval_base" | "headquarters" | "training_center";
  lat: number;
  lng: number;
  description: string;
  branch: string;
  status: "active" | "destroyed" | "occupied" | "relocated";
}

/**
 * Notable Ukrainian military installations and command centers.
 * Status reflects wartime condition as of late 2024. Many facilities
 * have been targeted by Russian strikes, occupied, or relocated since
 * the full-scale invasion began on 24 February 2022.
 */
export const UKRAINE_BASES: UkraineBase[] = [
  // -- Headquarters -----------------------------------------------------

  {
    id: "general-staff-hq",
    name: "General Staff of the Armed Forces of Ukraine",
    type: "headquarters",
    lat: 50.444,
    lng: 30.527,
    branch: "General Staff",
    description:
      "Supreme military command center in central Kyiv, responsible for " +
      "planning and coordination of all Ukrainian armed forces operations.",
    status: "active",
  },
  {
    id: "ground-forces-hq",
    name: "Ground Forces Command",
    type: "headquarters",
    lat: 50.448,
    lng: 30.502,
    branch: "Ground Forces",
    description:
      "Headquarters of the Ukrainian Ground Forces in Kyiv, " +
      "commanding the largest branch of the armed forces.",
    status: "active",
  },
  {
    id: "air-force-hq",
    name: "Air Force Command",
    type: "headquarters",
    lat: 49.235,
    lng: 28.468,
    branch: "Air Force",
    description:
      "Ukrainian Air Force command center in Vinnytsia, coordinating " +
      "air defense and strike operations across the country.",
    status: "active",
  },

  // -- Air Bases --------------------------------------------------------

  {
    id: "starokostiantyniv",
    name: "Starokostiantyniv Air Base",
    type: "air_base",
    lat: 49.505,
    lng: 27.198,
    branch: "Air Force",
    description:
      "Major tactical aviation base in Khmelnytskyi Oblast, home to " +
      "Su-24 bombers. Repeatedly struck by Russian cruise missiles " +
      "but remains operationally significant.",
    status: "active",
  },
  {
    id: "mirgorod",
    name: "Mirgorod Air Base",
    type: "air_base",
    lat: 49.969,
    lng: 33.615,
    branch: "Air Force",
    description:
      "Air base in Poltava Oblast historically hosting MiG-29 fighters. " +
      "Targeted multiple times during the full-scale invasion.",
    status: "active",
  },
  {
    id: "vasylkiv",
    name: "Vasylkiv Air Base",
    type: "air_base",
    lat: 50.245,
    lng: 30.31,
    branch: "Air Force",
    description:
      "Military airfield south of Kyiv, struck by Russian missiles on " +
      "the first night of the invasion. Site of a major fuel depot " +
      "explosion in February 2022.",
    status: "active",
  },
  {
    id: "kulbakino",
    name: "Kulbakino Air Base",
    type: "air_base",
    lat: 47.052,
    lng: 31.919,
    branch: "Air Force",
    description:
      "Military airfield near Mykolaiv, home to tactical aviation " +
      "units. Sustained significant damage from Russian strikes in " +
      "early 2022 but was not captured.",
    status: "active",
  },
  {
    id: "ozerne",
    name: "Ozerne Air Base",
    type: "air_base",
    lat: 50.153,
    lng: 27.765,
    branch: "Air Force",
    description:
      "Strategic aviation base in Zhytomyr Oblast, formerly hosting " +
      "long-range bombers. Struck by cruise missiles on the first day " +
      "of the full-scale invasion.",
    status: "active",
  },
  {
    id: "kanatove",
    name: "Kanatove Air Base",
    type: "air_base",
    lat: 48.543,
    lng: 32.284,
    branch: "Air Force",
    description:
      "Central Ukrainian air base near Kropyvnytskyi. Used for " +
      "dispersal operations and expected to support future F-16 " +
      "integration.",
    status: "active",
  },

  // -- Naval Bases ------------------------------------------------------

  {
    id: "odesa-naval",
    name: "Odesa Naval Base",
    type: "naval_base",
    lat: 46.488,
    lng: 30.742,
    branch: "Navy",
    description:
      "Primary operating base of the Ukrainian Navy after the loss " +
      "of Crimea in 2014. Headquarters of naval operations in the " +
      "Black Sea.",
    status: "active",
  },
  {
    id: "sevastopol-naval",
    name: "Sevastopol Naval Base",
    type: "naval_base",
    lat: 44.616,
    lng: 33.525,
    branch: "Navy",
    description:
      "Historic headquarters of the Ukrainian Navy, seized by Russian " +
      "forces during the 2014 annexation of Crimea. Remains under " +
      "Russian occupation.",
    status: "occupied",
  },
  {
    id: "ochakiv-naval",
    name: "Ochakiv Naval Base",
    type: "naval_base",
    lat: 46.616,
    lng: 31.541,
    branch: "Navy",
    description:
      "Naval facility near the Dnipro-Bug estuary in Mykolaiv Oblast. " +
      "Hosts special operations naval units and coastal defense " +
      "capabilities.",
    status: "active",
  },

  // -- Training Centers -------------------------------------------------

  {
    id: "yavoriv",
    name: "International Peacekeeping and Security Centre (Yavoriv)",
    type: "training_center",
    lat: 49.884,
    lng: 23.509,
    branch: "Ground Forces",
    description:
      "Major training facility in Lviv Oblast near the Polish border. " +
      "Hosted NATO training missions pre-invasion; struck by Russian " +
      "cruise missiles on 13 March 2022 killing 35.",
    status: "active",
  },
  {
    id: "desna",
    name: "Desna Training Ground",
    type: "training_center",
    lat: 51.505,
    lng: 31.411,
    branch: "Ground Forces",
    description:
      "Large combined-arms training center in Chernihiv Oblast. " +
      "Struck by Russian airstrikes in May 2022 causing significant " +
      "casualties among trainees.",
    status: "active",
  },
  {
    id: "zhytomyr-sof",
    name: "Zhytomyr Special Operations Base",
    type: "army_base",
    lat: 50.264,
    lng: 28.676,
    branch: "Special Operations",
    description:
      "Base of the Special Operations Forces Command in Zhytomyr. " +
      "SOF units have played a critical role in behind-the-lines " +
      "operations throughout the war.",
    status: "active",
  },
  {
    id: "shirokyi-lan",
    name: "Shirokyi Lan Training Range",
    type: "training_center",
    lat: 47.219,
    lng: 32.644,
    branch: "Ground Forces",
    description:
      "One of Ukraine's largest military training grounds in Mykolaiv " +
      "Oblast. Used for armor, artillery, and combined-arms exercises " +
      "including Western equipment familiarization.",
    status: "active",
  },
  {
    id: "belbek",
    name: "Belbek Air Base",
    type: "air_base",
    lat: 44.688,
    lng: 33.575,
    branch: "Air Force",
    description:
      "Former Ukrainian Air Force base near Sevastopol in Crimea, " +
      "seized by Russian forces in 2014. Now used by Russian " +
      "military aviation.",
    status: "occupied",
  },
];
