export interface NATOBase {
  id: string;
  name: string;
  lat: number;
  lng: number;
  country: string;
  baseType: "battlegroup" | "air-base" | "missile-defense" | "logistics" | "headquarters";
  frameworkNation?: string;
  description: string;
  significance: string;
}

/**
 * NATO eastern flank positions relevant to the Russo-Ukrainian War.
 * Includes Enhanced Forward Presence (eFP) battlegroups, post-2022
 * deployments, key air bases, missile-defense sites, and headquarters.
 */
export const NATO_BASES: NATOBase[] = [
  // -- eFP Battlegroups (original four, est. 2017) --------------------

  {
    id: "tapa",
    name: "Tapa Military Base",
    lat: 59.265,
    lng: 25.973,
    country: "Estonia",
    baseType: "battlegroup",
    frameworkNation: "United Kingdom",
    description:
      "UK-led eFP battlegroup in northern Estonia, reinforced to " +
      "brigade-size commitment after 2022.",
    significance:
      "Anchors NATO deterrence on the Baltic northern flank closest to " + "the Russian border.",
  },
  {
    id: "adazi",
    name: "Adazi Military Base",
    lat: 57.079,
    lng: 24.335,
    country: "Latvia",
    baseType: "battlegroup",
    frameworkNation: "Canada",
    description:
      "Canada-led eFP battlegroup at Camp Adazi, Latvia's primary " +
      "multinational training facility.",
    significance: "Central Baltic deterrence, integrating forces from multiple " + "NATO allies.",
  },
  {
    id: "rukla",
    name: "Rukla Military Base",
    lat: 55.077,
    lng: 24.206,
    country: "Lithuania",
    baseType: "battlegroup",
    frameworkNation: "Germany",
    description:
      "Germany-led eFP battlegroup, Germany's largest overseas troop " +
      "commitment since reunification.",
    significance: "Guards the Suwalki Gap corridor linking Poland to the Baltic states.",
  },
  {
    id: "orzysz",
    name: "Orzysz Training Ground",
    lat: 53.806,
    lng: 21.949,
    country: "Poland",
    baseType: "battlegroup",
    frameworkNation: "United States",
    description:
      "US-led eFP battlegroup in northeast Poland, co-located with " + "Polish armored units.",
    significance:
      "Southern anchor of the original four eFP battlegroups, covering " + "the Suwalki corridor.",
  },

  // -- Post-2022 Battlegroups (eastern flank expansion) ---------------

  {
    id: "lest",
    name: "Lest Air Base",
    lat: 48.384,
    lng: 19.267,
    country: "Slovakia",
    baseType: "battlegroup",
    frameworkNation: "Czechia",
    description:
      "Czechia-led battlegroup established after the 2022 Madrid Summit " +
      "to extend NATO coverage southward.",
    significance:
      "Part of the post-invasion expansion of forward-deployed forces " +
      "on NATO's eastern flank.",
  },
  {
    id: "szekesfehervar",
    name: "Szekesfehervar Garrison",
    lat: 47.189,
    lng: 18.41,
    country: "Hungary",
    baseType: "battlegroup",
    frameworkNation: "Italy",
    description:
      "Italy-led multinational battlegroup in central Hungary, activated " +
      "after the 2022 Madrid Summit.",
    significance:
      "Extended NATO forward presence into Hungary despite political " + "complexities.",
  },
  {
    id: "cincu",
    name: "Cincu Training Range",
    lat: 45.845,
    lng: 24.633,
    country: "Romania",
    baseType: "battlegroup",
    frameworkNation: "France",
    description:
      "France-led battlegroup at Romania's largest training ground, " + "established post-2022.",
    significance:
      "Strengthens NATO posture on the Black Sea flank directly " +
      "relevant to the war in Ukraine.",
  },
  {
    id: "novo-selo",
    name: "Novo Selo Training Area",
    lat: 42.049,
    lng: 25.95,
    country: "Bulgaria",
    baseType: "battlegroup",
    frameworkNation: "Italy",
    description:
      "Italy-led battlegroup at Novo Selo, Bulgaria's primary " +
      "multinational training facility.",
    significance:
      "Southernmost NATO battlegroup, extending deterrence to the " + "Black Sea region.",
  },

  // -- Key Air Bases and Logistics Hubs --------------------------------

  {
    id: "rzeszow",
    name: "Rzeszow-Jasionka Airport",
    lat: 50.11,
    lng: 22.019,
    country: "Poland",
    baseType: "air-base",
    description:
      "Dual-use airport 90 km from the Ukrainian border serving as " +
      "the primary staging point for military aid to Ukraine.",
    significance:
      "Largest single logistics node for Western weapons deliveries " +
      "into Ukraine since February 2022.",
  },
  {
    id: "mihail-kogalniceanu",
    name: "Mihail Kogalniceanu Air Base",
    lat: 44.363,
    lng: 28.488,
    country: "Romania",
    baseType: "air-base",
    description:
      "Major US and NATO deployment base near the Black Sea coast, " +
      "significantly expanded since 2022.",
    significance:
      "Key Black Sea region air operations hub and potential permanent " + "US forward base.",
  },
  {
    id: "lask",
    name: "Lask Air Base",
    lat: 51.551,
    lng: 19.179,
    country: "Poland",
    baseType: "air-base",
    description: "Polish Air Force F-16 base, hosts rotating NATO air-policing " + "detachments.",
    significance: "Central Poland air-defense node supporting NATO eastern flank " + "operations.",
  },

  // -- Missile Defense Sites -------------------------------------------

  {
    id: "deveselu",
    name: "Deveselu Aegis Ashore Site",
    lat: 44.053,
    lng: 24.417,
    country: "Romania",
    baseType: "missile-defense",
    description:
      "Aegis Ashore ballistic missile defense facility operational " +
      "since 2016, part of NATO's European Phased Adaptive Approach.",
    significance:
      "First operational land-based Aegis BMD site in Europe, a " +
      "long-standing point of Russian objection.",
  },
  {
    id: "redzikowo",
    name: "Redzikowo Aegis Ashore Site",
    lat: 54.478,
    lng: 17.101,
    country: "Poland",
    baseType: "missile-defense",
    description:
      "Second European Aegis Ashore site, activated November 2024 " +
      "after years of construction delays.",
    significance:
      "Completes NATO's European missile-defense shield covering " +
      "both southern and northern approaches.",
  },

  // -- Headquarters ----------------------------------------------------

  {
    id: "ramstein",
    name: "Ramstein Air Base",
    lat: 49.437,
    lng: 7.6,
    country: "Germany",
    baseType: "headquarters",
    description:
      "USAF Headquarters Europe and NATO Allied Air Command. Hosts " +
      "Ukraine Defense Contact Group (Ramstein format) meetings.",
    significance:
      "Primary coordination hub for international military aid to " +
      "Ukraine and NATO air operations in Europe.",
  },
];
