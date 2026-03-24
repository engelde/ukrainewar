export interface RussiaBase {
  name: string;
  type: "air_base" | "army_base" | "naval_base" | "headquarters" | "missile_base" | "logistics";
  lat: number;
  lng: number;
  description: string;
  district: string;
  status: "active" | "damaged" | "destroyed";
}

/**
 * Major Russian military installations relevant to the Russo-Ukrainian War.
 * Includes strategic bomber bases, Black Sea Fleet facilities, Crimean
 * installations, border logistics hubs, and missile sites. Status reflects
 * known Ukrainian strikes through 2024.
 */
export const RUSSIA_BASES: RussiaBase[] = [
  // -- Headquarters -----------------------------------------------------

  {
    name: "Southern Military District HQ",
    type: "headquarters",
    lat: 47.236,
    lng: 39.702,
    description:
      "Southern Military District headquarters in Rostov-on-Don. " +
      "Primary command center for operations in Ukraine until the " +
      "June 2023 Wagner mutiny briefly seized the building.",
    district: "Southern",
    status: "active",
  },

  // -- Strategic Bomber Bases -------------------------------------------

  {
    name: "Engels-2 Air Base",
    type: "air_base",
    lat: 51.481,
    lng: 46.201,
    description:
      "Home of Tu-95MS and Tu-160 strategic bombers near Saratov. " +
      "Primary launch site for Kh-101 cruise missile strikes against " +
      "Ukrainian infrastructure. Struck by Ukrainian drones in " +
      "December 2022 and subsequent attacks.",
    district: "Central",
    status: "damaged",
  },
  {
    name: "Dyagilevo Air Base",
    type: "air_base",
    lat: 54.616,
    lng: 39.572,
    description:
      "Tu-22M3 bomber base near Ryazan and Long-Range Aviation " +
      "training center. Hit by Ukrainian drone strike in December " +
      "2022 alongside Engels, damaging at least one aircraft.",
    district: "Western",
    status: "damaged",
  },
  {
    name: "Shaykovka Air Base",
    type: "air_base",
    lat: 54.017,
    lng: 34.146,
    description:
      "Tu-22M3 backfire bomber base in Kaluga Oblast. Used for " +
      "Kh-22 anti-ship missile strikes repurposed against Ukrainian " +
      "ground targets, notably the Kremenchuk shopping center strike.",
    district: "Western",
    status: "active",
  },
  {
    name: "Mozdok Air Base",
    type: "air_base",
    lat: 43.79,
    lng: 44.587,
    description:
      "Major tactical air base in North Ossetia used extensively " +
      "during Chechen wars. Supports fighter-bomber and attack " +
      "aircraft operations for the southern axis of the Ukraine war.",
    district: "Southern",
    status: "active",
  },

  // -- Crimean Air Bases ------------------------------------------------

  {
    name: "Saki Air Base (Novofedorovka)",
    type: "air_base",
    lat: 45.093,
    lng: 33.576,
    description:
      "Naval aviation base on Crimea's west coast. Devastated by " +
      "massive explosions on 9 August 2022 that destroyed multiple " +
      "aircraft — the first major Ukrainian strike deep in Crimea.",
    district: "Southern",
    status: "damaged",
  },
  {
    name: "Belbek Air Base",
    type: "air_base",
    lat: 44.689,
    lng: 33.575,
    description:
      "Fighter air base north of Sevastopol hosting Su-27 and " +
      "Su-30 interceptors for Crimean air defense. Struck by " +
      "Ukrainian ATACMS missiles in 2024, damaging air defense " +
      "assets and aircraft.",
    district: "Southern",
    status: "damaged",
  },
  {
    name: "Gvardeyskoye Air Base",
    type: "air_base",
    lat: 45.115,
    lng: 33.978,
    description:
      "Central Crimean air base near Simferopol supporting " +
      "Su-24 and Su-25 ground-attack sorties over southern Ukraine.",
    district: "Southern",
    status: "active",
  },
  {
    name: "Dzhankoi Air Base",
    type: "air_base",
    lat: 45.712,
    lng: 34.393,
    description:
      "Air base and logistics hub in northern Crimea. Struck " +
      "multiple times by Ukraine starting August 2022, with " +
      "ammunition depot explosions and damage to rail infrastructure.",
    district: "Southern",
    status: "damaged",
  },

  // -- Black Sea Fleet --------------------------------------------------

  {
    name: "Sevastopol Naval Base",
    type: "naval_base",
    lat: 44.617,
    lng: 33.525,
    description:
      "Black Sea Fleet headquarters and primary anchorage. " +
      "Suffered devastating losses including the Moskva cruiser " +
      "sinking, multiple landing ships, and the submarine Rostov-on-Don " +
      "destroyed in drydock by Storm Shadow missiles in September 2023.",
    district: "Southern",
    status: "damaged",
  },
  {
    name: "Novorossiysk Naval Base",
    type: "naval_base",
    lat: 44.724,
    lng: 37.769,
    description:
      "Secondary Black Sea Fleet base in Krasnodar Krai. Received " +
      "relocated fleet assets after repeated Ukrainian strikes on " +
      "Sevastopol forced dispersal of remaining warships.",
    district: "Southern",
    status: "active",
  },

  // -- Southern Tactical Air Bases --------------------------------------

  {
    name: "Millerovo Air Base",
    type: "air_base",
    lat: 48.927,
    lng: 40.354,
    description:
      "Fighter base in Rostov Oblast just 20 km from the Ukrainian " +
      "border. Hosts Su-30SM fighters and was struck by a Ukrainian " +
      "OTR-21 Tochka missile in the opening days of the invasion.",
    district: "Southern",
    status: "active",
  },
  {
    name: "Krymsk Air Base",
    type: "air_base",
    lat: 44.933,
    lng: 37.98,
    description:
      "Tactical fighter base in Krasnodar Krai hosting Su-27 and " +
      "Su-30 fighters supporting air operations over the Black Sea " +
      "and southern Ukraine.",
    district: "Southern",
    status: "active",
  },
  {
    name: "Kushchyovskaya Air Base",
    type: "air_base",
    lat: 46.543,
    lng: 39.624,
    description:
      "Attack aviation base in Krasnodar Krai. Hosts Su-25 " +
      "ground-attack aircraft and Ka-52 attack helicopters " +
      "conducting close air support missions over Donbas.",
    district: "Southern",
    status: "active",
  },
  {
    name: "Marinovka Air Base",
    type: "air_base",
    lat: 48.82,
    lng: 43.13,
    description:
      "Tactical air base in Volgograd Oblast supporting Su-34 " +
      "fighter-bomber operations and glide-bomb strikes against " +
      "Ukrainian positions along the southern front.",
    district: "Southern",
    status: "active",
  },

  // -- Border Logistics & Garrisons ------------------------------------

  {
    name: "Belgorod Logistics Hub",
    type: "logistics",
    lat: 50.6,
    lng: 36.588,
    description:
      "Major staging and supply node in Belgorod Oblast supporting " +
      "operations in Kharkiv direction. Targeted by Ukrainian " +
      "cross-border shelling and drone strikes since 2022.",
    district: "Western",
    status: "active",
  },
  {
    name: "Kursk Military Garrison",
    type: "army_base",
    lat: 51.737,
    lng: 36.188,
    description:
      "Garrison and logistics center in Kursk Oblast. The region " +
      "became a frontline in August 2024 when Ukraine launched a " +
      "cross-border incursion seizing territory in Kursk Oblast.",
    district: "Western",
    status: "active",
  },

  // -- Missile & Testing Facilities ------------------------------------

  {
    name: "Kapustin Yar",
    type: "missile_base",
    lat: 48.566,
    lng: 45.764,
    description:
      "Historic rocket and missile test range in Astrakhan Oblast. " +
      "Used for testing and integrating missile systems deployed " +
      "in the Ukraine conflict, including Iskander variants.",
    district: "Southern",
    status: "active",
  },

  // -- Ammunition & Supply Depots --------------------------------------

  {
    name: "Tikhoretsk Ammunition Depot",
    type: "logistics",
    lat: 45.854,
    lng: 40.131,
    description:
      "Major ammunition storage facility in Krasnodar Krai. " +
      "Struck by Ukrainian long-range drones in 2024, triggering " +
      "large secondary explosions visible on satellite imagery.",
    district: "Southern",
    status: "damaged",
  },
  {
    name: "Toropets Ammunition Depot",
    type: "logistics",
    lat: 56.498,
    lng: 31.634,
    description:
      "Strategic ammunition and missile storage facility in Tver " +
      "Oblast. Destroyed by a massive Ukrainian drone strike in " +
      "September 2024, registering as a seismic event and " +
      "devastating KN-2 Iskander and glide-bomb stockpiles.",
    district: "Western",
    status: "destroyed",
  },
];
