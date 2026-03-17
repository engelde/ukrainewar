export interface Battle {
  id: string;
  name: string;
  startDate: string; // YYYYMMDD
  endDate?: string; // YYYYMMDD, undefined if ongoing
  lat: number;
  lng: number;
  description: string;
  outcome?: string;
  significance: "critical" | "major" | "significant";
}

// Major battles of the Russo-Ukrainian War (2022-present)
export const MAJOR_BATTLES: Battle[] = [
  {
    id: "kyiv",
    name: "Battle of Kyiv",
    startDate: "20220224",
    endDate: "20220402",
    lat: 50.4501,
    lng: 30.5234,
    description:
      "Russian forces attempted to capture Kyiv from the north via Belarus. Ukraine successfully defended the capital, forcing a full Russian withdrawal.",
    outcome: "Ukrainian victory",
    significance: "critical",
  },
  {
    id: "kherson-capture",
    name: "Fall of Kherson",
    startDate: "20220224",
    endDate: "20220302",
    lat: 46.6354,
    lng: 32.6169,
    description:
      "Kherson was the first major Ukrainian city to fall to Russian forces, becoming a key strategic position on the Dnipro River.",
    outcome: "Russian capture",
    significance: "critical",
  },
  {
    id: "mariupol",
    name: "Siege of Mariupol",
    startDate: "20220224",
    endDate: "20220520",
    lat: 47.0951,
    lng: 37.5437,
    description:
      "Nearly 3-month siege of Mariupol. Azovstal steel plant became the last Ukrainian stronghold. Over 20,000 civilian casualties estimated.",
    outcome: "Russian capture after prolonged siege",
    significance: "critical",
  },
  {
    id: "hostomel",
    name: "Battle of Hostomel",
    startDate: "20220224",
    endDate: "20220401",
    lat: 50.5685,
    lng: 30.2115,
    description:
      "Russian airborne forces attempted to seize Antonov Airport on Day 1. Ukraine counterattacked, denying Russia a staging area near Kyiv.",
    outcome: "Ukrainian victory",
    significance: "major",
  },
  {
    id: "sumy",
    name: "Battle of Sumy",
    startDate: "20220224",
    endDate: "20220404",
    lat: 50.9077,
    lng: 34.7981,
    description:
      "Russian forces besieged Sumy from the northeast but failed to capture it. City was liberated when Russia withdrew from northern Ukraine.",
    outcome: "Ukrainian victory",
    significance: "major",
  },
  {
    id: "chernihiv",
    name: "Battle of Chernihiv",
    startDate: "20220224",
    endDate: "20220404",
    lat: 51.4982,
    lng: 31.2893,
    description:
      "Russian forces surrounded and besieged Chernihiv. Despite heavy bombardment, Ukrainian forces held the city until Russian withdrawal.",
    outcome: "Ukrainian victory",
    significance: "major",
  },
  {
    id: "severodonetsk",
    name: "Battle of Severodonetsk",
    startDate: "20220506",
    endDate: "20220625",
    lat: 48.9486,
    lng: 38.4939,
    description:
      "Intense urban fighting in the Donbas. Ukrainian forces eventually withdrew across the Siverskyi Donets River after heavy losses on both sides.",
    outcome: "Russian capture",
    significance: "major",
  },
  {
    id: "lysychansk",
    name: "Battle of Lysychansk",
    startDate: "20220625",
    endDate: "20220703",
    lat: 48.9042,
    lng: 38.4381,
    description:
      "Fall of Lysychansk completed Russian control of Luhansk Oblast. Ukraine conducted an orderly withdrawal to preserve forces.",
    outcome: "Russian capture",
    significance: "major",
  },
  {
    id: "kharkiv-offensive",
    name: "Kharkiv Counteroffensive",
    startDate: "20220906",
    endDate: "20221002",
    lat: 49.2328,
    lng: 37.2,
    description:
      "Stunning Ukrainian counteroffensive that liberated over 12,000 km² in weeks, including Izium and Kupiansk. Russia's fastest territorial loss.",
    outcome: "Major Ukrainian victory",
    significance: "critical",
  },
  {
    id: "kherson-liberation",
    name: "Liberation of Kherson",
    startDate: "20220829",
    endDate: "20221111",
    lat: 46.6354,
    lng: 32.6169,
    description:
      "Ukraine's southern counteroffensive culminated in the liberation of Kherson, the only regional capital captured by Russia. Russians withdrew across the Dnipro.",
    outcome: "Major Ukrainian victory",
    significance: "critical",
  },
  {
    id: "bakhmut",
    name: "Battle of Bakhmut",
    startDate: "20220801",
    endDate: "20230520",
    lat: 48.5955,
    lng: 38.0006,
    description:
      "Longest and bloodiest battle of the war. Wagner PMC forces captured the city after 10 months. Estimated 20,000-30,000 Russian casualties.",
    outcome: "Russian capture at enormous cost",
    significance: "critical",
  },
  {
    id: "vuhledar-2023",
    name: "Battles of Vuhledar (2023)",
    startDate: "20230124",
    endDate: "20230311",
    lat: 47.7779,
    lng: 37.2504,
    description:
      "Multiple failed Russian assaults on Vuhledar. Russian 155th Marine Brigade suffered catastrophic losses including dozens of vehicles.",
    outcome: "Ukrainian defensive victory",
    significance: "significant",
  },
  {
    id: "zaporizhia-offensive",
    name: "Zaporizhia Counteroffensive",
    startDate: "20230608",
    endDate: "20231031",
    lat: 47.3,
    lng: 36.0,
    description:
      "Ukraine's summer 2023 counteroffensive aimed at cutting the land bridge to Crimea. Progress was slow through dense Russian minefields and fortifications.",
    outcome: "Limited Ukrainian gains",
    significance: "critical",
  },
  {
    id: "avdiivka",
    name: "Battle of Avdiivka",
    startDate: "20231010",
    endDate: "20240217",
    lat: 48.1405,
    lng: 37.7472,
    description:
      "4-month battle for the heavily fortified town. Russia eventually captured it after Ukraine withdrew to avoid encirclement. Massive Russian casualties.",
    outcome: "Russian capture",
    significance: "critical",
  },
  {
    id: "robotyne",
    name: "Battle of Robotyne",
    startDate: "20230804",
    endDate: "20231130",
    lat: 47.4423,
    lng: 35.8306,
    description:
      "Key engagement during Ukraine's southern counteroffensive. Ukraine captured Robotyne and advanced toward the Surovikin Line.",
    outcome: "Ukrainian capture, later contested",
    significance: "significant",
  },
  {
    id: "kursk",
    name: "Kursk Incursion",
    startDate: "20240806",
    endDate: "20250309",
    lat: 51.3,
    lng: 35.1,
    description:
      "Bold Ukrainian cross-border offensive into Russia's Kursk Oblast. Ukraine captured ~1,300 km² of Russian territory before eventual Russian recapture.",
    outcome: "Initial Ukrainian success, later Russian recapture",
    significance: "critical",
  },
  {
    id: "pokrovsk",
    name: "Battle of Pokrovsk",
    startDate: "20240701",
    endDate: undefined,
    lat: 48.2862,
    lng: 37.1833,
    description:
      "Russian offensive toward the strategic logistics hub of Pokrovsk. One of the most active frontline sectors with heavy daily fighting.",
    outcome: "Ongoing",
    significance: "critical",
  },
  {
    id: "vuhledar-fall",
    name: "Fall of Vuhledar",
    startDate: "20240901",
    endDate: "20241002",
    lat: 47.7779,
    lng: 37.2504,
    description:
      "After successfully defending since 2022, Ukrainian forces withdrew from Vuhledar following a Russian flanking maneuver.",
    outcome: "Russian capture",
    significance: "major",
  },
  {
    id: "kurakhove",
    name: "Battle of Kurakhove",
    startDate: "20241101",
    endDate: "20250106",
    lat: 47.9833,
    lng: 37.3,
    description:
      "Russian forces captured the town after an extended siege, continuing the slow advance in Donetsk Oblast.",
    outcome: "Russian capture",
    significance: "major",
  },
  {
    id: "chasiv-yar",
    name: "Battle of Chasiv Yar",
    startDate: "20240401",
    endDate: "20250715",
    lat: 48.6,
    lng: 37.85,
    description:
      "Strategically elevated city west of Bakhmut. Prolonged Russian assault, fiercely defended by Ukraine due to its commanding terrain.",
    outcome: "Russian capture after extended siege",
    significance: "critical",
  },
];
