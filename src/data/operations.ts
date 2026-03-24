export interface Waypoint {
  lat: number;
  lng: number;
  label?: string;
}

export interface MilitaryOperation {
  id: string;
  name: string;
  officialName?: string;
  startDate: string; // YYYYMMDD
  endDate?: string; // YYYYMMDD, undefined if ongoing
  initiator: "Russia" | "Ukraine";
  /** Lowercase side tag used for map styling */
  side: "russia" | "ukraine";
  type:
    | "offensive"
    | "counter-offensive"
    | "siege"
    | "retreat"
    | "incursion"
    | "defensive"
    | "naval";
  significance: "critical" | "major" | "significant";
  description: string;
  outcome:
    | "Russian victory"
    | "Ukrainian victory"
    | "Stalemate"
    | "Inconclusive"
    | "Partial success"
    | "Ongoing";
  /** Ordered waypoints tracing the direction of advance / movement */
  waypoints: Waypoint[];
  /** True when the end date is a projection or the operation is still active */
  isOngoing?: boolean;
}

/**
 * ~28 most significant military operations of the Russo-Ukrainian War
 * (24 Feb 2022 – early 2026).
 *
 * Waypoints trace the axis of advance and should be rendered as arrow
 * paths: waypoints[0] → waypoints[n-1].
 */
export const MILITARY_OPERATIONS: MilitaryOperation[] = [
  // ── INITIAL RUSSIAN INVASION – Feb 2022 ───────────────────────────

  {
    id: "kyiv-axis",
    name: "Kyiv Axis Offensive",
    officialName: "Northern Front – Kyiv Direction",
    startDate: "20220224",
    endDate: "20220402",
    initiator: "Russia",
    side: "russia",
    significance: "critical",
    type: "offensive",
    description:
      "Russian forces advanced from Belarus toward Kyiv via Chernobyl and " +
      "Hostomel airfield. Fierce Ukrainian resistance and logistical " +
      "failures forced a full withdrawal by early April.",
    outcome: "Ukrainian victory",
    waypoints: [
      { lat: 51.39, lng: 30.1, label: "Belarus border (Chernobyl zone)" },
      { lat: 51.1, lng: 30.07, label: "Chernobyl / Pripyat" },
      { lat: 50.87, lng: 30.22, label: "Ivankiv" },
      { lat: 50.57, lng: 30.21, label: "Hostomel / Antonov Airport" },
      { lat: 50.54, lng: 30.21, label: "Bucha / Irpin" },
      { lat: 50.45, lng: 30.52, label: "Kyiv (objective, not reached)" },
    ],
  },
  {
    id: "chernihiv-axis",
    name: "Chernihiv Axis Offensive",
    startDate: "20220224",
    endDate: "20220404",
    initiator: "Russia",
    side: "russia",
    significance: "major",
    type: "offensive",
    description:
      "Russian forces advanced from Belarus toward Chernihiv, surrounding " +
      "the city. Despite heavy bombardment, Ukrainian forces held until " +
      "Russia withdrew from the entire northern front.",
    outcome: "Ukrainian victory",
    waypoints: [
      { lat: 52.35, lng: 31.3, label: "Belarus border (Gomel region)" },
      { lat: 51.5, lng: 31.29, label: "Chernihiv (besieged)" },
      { lat: 51.08, lng: 31.15, label: "Nizhyn" },
      { lat: 50.45, lng: 30.52, label: "Kyiv (objective, not reached)" },
    ],
  },
  {
    id: "sumy-axis",
    name: "Sumy Axis Offensive",
    officialName: "Northern Front – Sumy Direction",
    startDate: "20220224",
    endDate: "20220404",
    initiator: "Russia",
    side: "russia",
    significance: "major",
    type: "offensive",
    description:
      "Russian forces crossed from Belgorod Oblast toward Sumy, aiming " +
      "to encircle Kyiv from the east. They besieged Sumy but failed to " +
      "capture it and withdrew in early April.",
    outcome: "Ukrainian victory",
    waypoints: [
      { lat: 51.25, lng: 35.3, label: "Russia border (Belgorod)" },
      { lat: 50.91, lng: 34.8, label: "Sumy" },
      { lat: 50.63, lng: 33.75, label: "Romny" },
      { lat: 50.45, lng: 32.06, label: "Pryluky (toward Kyiv)" },
    ],
  },
  {
    id: "kharkiv-axis",
    name: "Kharkiv Axis Offensive",
    officialName: "Northeastern Front",
    startDate: "20220224",
    endDate: "20220514",
    initiator: "Russia",
    side: "russia",
    significance: "major",
    type: "offensive",
    description:
      "Russian forces attacked Kharkiv from the border, entering the " +
      "city outskirts. Ukraine repelled the assault by mid-May, pushing " +
      "Russian forces back across the Siverskyi Donets River.",
    outcome: "Ukrainian victory",
    waypoints: [
      { lat: 50.38, lng: 36.62, label: "Russia border (Belgorod Oblast)" },
      { lat: 50.0, lng: 36.25, label: "Kharkiv outskirts" },
      { lat: 49.85, lng: 36.57, label: "Chuhuiv" },
      { lat: 49.68, lng: 37.15, label: "Balakliia" },
    ],
  },
  {
    id: "southern-axis",
    name: "Southern Axis Offensive",
    officialName: "Southern Front – Land Bridge",
    startDate: "20220224",
    endDate: "20220325",
    initiator: "Russia",
    side: "russia",
    significance: "critical",
    type: "offensive",
    description:
      "Russian forces advanced rapidly from Crimea, capturing Kherson, " +
      "Melitopol, and Berdyansk, establishing a land bridge between " +
      "Crimea and Donbas. Russia's most successful early axis.",
    outcome: "Russian victory",
    waypoints: [
      { lat: 46.19, lng: 33.87, label: "Crimea (Perekop isthmus)" },
      { lat: 46.64, lng: 32.62, label: "Kherson" },
      { lat: 46.84, lng: 35.37, label: "Melitopol" },
      { lat: 46.76, lng: 36.79, label: "Berdyansk" },
      { lat: 47.1, lng: 37.54, label: "Toward Mariupol" },
    ],
  },

  // ── SIEGE OF MARIUPOL – Feb–May 2022 ──────────────────────────────

  {
    id: "mariupol-siege",
    name: "Siege of Mariupol",
    startDate: "20220224",
    endDate: "20220520",
    initiator: "Russia",
    side: "russia",
    significance: "critical",
    type: "siege",
    description:
      "Russian and DPR forces encircled Mariupol from east and west, " +
      "devastating the city. The last defenders held out at Azovstal " +
      "steel works until surrendering on May 20. Est. 25,000+ civilian deaths.",
    outcome: "Russian victory",
    waypoints: [
      { lat: 47.1, lng: 37.0, label: "Western approach (from Crimea)" },
      { lat: 47.15, lng: 37.85, label: "Eastern approach (from Donetsk)" },
      { lat: 47.1, lng: 37.54, label: "Mariupol city center" },
      { lat: 47.096, lng: 37.615, label: "Azovstal steel works" },
    ],
  },

  // ── RUSSIAN WITHDRAWAL FROM NORTH – Mar–Apr 2022 ──────────────────

  {
    id: "northern-withdrawal",
    name: "Russian Withdrawal from Northern Ukraine",
    startDate: "20220325",
    endDate: "20220406",
    initiator: "Russia",
    side: "russia",
    significance: "critical",
    type: "retreat",
    description:
      "Russia announced a 'goodwill gesture' withdrawal from the Kyiv, " +
      "Chernihiv, and Sumy fronts. In reality forces had been repelled. " +
      "The withdrawal revealed the Bucha massacre evidence.",
    outcome: "Ukrainian victory",
    waypoints: [
      { lat: 50.54, lng: 30.21, label: "Bucha / Irpin (withdrawal start)" },
      { lat: 50.87, lng: 30.22, label: "Ivankiv" },
      { lat: 51.39, lng: 30.1, label: "Belarus border (withdrawal end)" },
    ],
  },

  // ── SNAKE ISLAND – Feb–Jun 2022 ───────────────────────────────────

  {
    id: "snake-island",
    name: "Battle of Snake Island",
    officialName: "Zmiinyi Island Campaign",
    startDate: "20220224",
    endDate: "20220630",
    initiator: "Ukraine",
    side: "ukraine",
    significance: "significant",
    type: "counter-offensive",
    description:
      "Russia seized Snake Island on Day 1 (famous 'Russian warship, go " +
      "f*** yourself' exchange). Ukraine conducted repeated strikes, " +
      "eventually forcing a Russian withdrawal on June 30.",
    outcome: "Ukrainian victory",
    waypoints: [
      { lat: 45.26, lng: 30.2, label: "Snake Island (Zmiinyi)" },
      { lat: 46.48, lng: 30.74, label: "Odesa (Ukrainian strikes from)" },
    ],
  },

  // ── IZIUM ADVANCE – Mar–Jun 2022 ──────────────────────────────────

  {
    id: "izium-advance",
    name: "Izium Advance",
    startDate: "20220317",
    endDate: "20220601",
    initiator: "Russia",
    side: "russia",
    significance: "major",
    type: "offensive",
    description:
      "Russian forces captured Izium and used it as a staging area to " +
      "push south toward the Donbas. The advance stalled and Izium " +
      "became overextended, later recaptured in the Kharkiv counteroffensive.",
    outcome: "Stalemate",
    waypoints: [
      { lat: 50.0, lng: 36.25, label: "Kharkiv Oblast (from north)" },
      { lat: 49.62, lng: 37.25, label: "Balakliia" },
      { lat: 49.21, lng: 37.26, label: "Izium" },
      { lat: 48.98, lng: 37.55, label: "Toward Sloviansk (stalled)" },
    ],
  },

  // ── SEVERODONETSK–LYSYCHANSK – May–Jul 2022 ───────────────────────

  {
    id: "severodonetsk-lysychansk",
    name: "Battle of Severodonetsk–Lysychansk",
    officialName: "Battle of the Luhansk Salient",
    startDate: "20220506",
    endDate: "20220703",
    initiator: "Russia",
    side: "russia",
    significance: "major",
    type: "offensive",
    description:
      "Russian forces attacked the twin cities of Severodonetsk and " +
      "Lysychansk, the last major Ukrainian holdouts in Luhansk Oblast. " +
      "Fierce urban combat ended with a Ukrainian withdrawal in early July.",
    outcome: "Russian victory",
    waypoints: [
      { lat: 49.02, lng: 38.22, label: "Popasna (Russian jumping off)" },
      { lat: 48.95, lng: 38.49, label: "Severodonetsk" },
      { lat: 48.93, lng: 38.44, label: "Lysychansk" },
      { lat: 48.87, lng: 38.36, label: "Zolote pocket" },
    ],
  },

  // ── BLACK SEA CAMPAIGN – Apr 2022 onward ──────────────────────────

  {
    id: "black-sea-campaign",
    name: "Black Sea Campaign",
    officialName: "Sinking of Moskva & Anti-Ship Operations",
    startDate: "20220414",
    endDate: "20240301",
    initiator: "Ukraine",
    side: "ukraine",
    significance: "major",
    type: "naval",
    description:
      "Ukraine sank the Black Sea Fleet flagship Moskva with Neptune " +
      "missiles on Apr 14, 2022, then systematically degraded Russian " +
      "naval power using drones, forcing the fleet from Crimean ports.",
    outcome: "Ukrainian victory",
    waypoints: [
      { lat: 46.48, lng: 30.74, label: "Odesa coast" },
      { lat: 45.3, lng: 31.0, label: "Moskva sinking location" },
      { lat: 44.62, lng: 33.53, label: "Sevastopol (fleet base)" },
      { lat: 45.31, lng: 36.51, label: "Kerch Strait" },
    ],
  },

  // ── UKRAINIAN COUNTER-OFFENSIVES – Fall 2022 ──────────────────────

  {
    id: "kharkiv-counteroffensive",
    name: "Kharkiv Counteroffensive",
    officialName: "2022 Ukrainian Eastern Counteroffensive",
    startDate: "20220906",
    endDate: "20221002",
    initiator: "Ukraine",
    side: "ukraine",
    significance: "critical",
    type: "counter-offensive",
    description:
      "Lightning Ukrainian counteroffensive that liberated over 12,000 " +
      "km2 in Kharkiv Oblast, including Balakliia, Izium, Kupiansk, " +
      "and Lyman. Russia's fastest territorial collapse of the war.",
    outcome: "Ukrainian victory",
    waypoints: [
      { lat: 49.46, lng: 36.85, label: "Balakliya (start of attack)" },
      { lat: 49.4, lng: 37.01, label: "Shevchenkove" },
      { lat: 49.21, lng: 37.26, label: "Izium (liberated Sep 10)" },
      { lat: 49.71, lng: 37.62, label: "Kupiansk (liberated Sep 10)" },
      { lat: 48.98, lng: 37.81, label: "Lyman (liberated Oct 1)" },
    ],
  },
  {
    id: "kherson-counteroffensive",
    name: "Kherson Counteroffensive",
    officialName: "2022 Kherson Counteroffensive",
    startDate: "20220829",
    endDate: "20221111",
    initiator: "Ukraine",
    side: "ukraine",
    significance: "critical",
    type: "counter-offensive",
    description:
      "Ukraine's southern counteroffensive combined HIMARS strikes on " +
      "supply lines with ground advances, forcing Russia to withdraw " +
      "from the right bank of the Dnipro and abandon Kherson city.",
    outcome: "Ukrainian victory",
    waypoints: [
      { lat: 47.05, lng: 32.5, label: "Ukrainian positions (north)" },
      { lat: 46.91, lng: 32.55, label: "Davydiv Brid axis" },
      { lat: 46.82, lng: 33.06, label: "Dudchany" },
      { lat: 46.64, lng: 32.62, label: "Kherson (liberated Nov 11)" },
    ],
  },

  // ── BATTLE OF BAKHMUT – Aug 2022 – May 2023 ──────────────────────

  {
    id: "bakhmut",
    name: "Battle of Bakhmut",
    officialName: "Siege of Bakhmut",
    startDate: "20220801",
    endDate: "20230520",
    initiator: "Russia",
    side: "russia",
    significance: "critical",
    type: "siege",
    description:
      "The war's longest and bloodiest battle. Wagner PMC forces led a " +
      "10-month grinding assault, capturing the city at enormous cost. " +
      "Called the 'Verdun' of this war; est. 20,000–30,000 Russian casualties.",
    outcome: "Russian victory",
    waypoints: [
      { lat: 48.63, lng: 38.2, label: "Soledar (north approach)" },
      { lat: 48.57, lng: 38.11, label: "Eastern Bakhmut outskirts" },
      { lat: 48.59, lng: 38.0, label: "Bakhmut center" },
      { lat: 48.6, lng: 37.88, label: "Western Bakhmut (final front)" },
    ],
  },

  // ── 2023 UKRAINIAN COUNTEROFFENSIVE ───────────────────────────────

  {
    id: "zaporizhzhia-counteroffensive",
    name: "Zaporizhzhia Counteroffensive",
    officialName: "2023 Ukrainian Counteroffensive – Melitopol Direction",
    startDate: "20230608",
    endDate: "20231031",
    initiator: "Ukraine",
    side: "ukraine",
    significance: "critical",
    type: "counter-offensive",
    description:
      "Ukraine's main summer 2023 offensive aimed at cutting the Russian " +
      "land bridge to Crimea via Zaporizhzhia. Dense minefields and " +
      "layered Russian defenses limited gains to roughly 20 km.",
    outcome: "Inconclusive",
    waypoints: [
      { lat: 47.7, lng: 36.1, label: "Orikhiv (staging area)" },
      { lat: 47.55, lng: 35.92, label: "Robotyne (captured Aug)" },
      { lat: 47.44, lng: 35.83, label: "Toward Tokmak (objective)" },
      { lat: 47.25, lng: 35.71, label: "Tokmak (not reached)" },
    ],
  },
  {
    id: "berdiansk-direction",
    name: "Berdiansk Direction Offensive",
    officialName: "2023 Ukrainian Counteroffensive – Berdiansk Direction",
    startDate: "20230608",
    endDate: "20231031",
    initiator: "Ukraine",
    side: "ukraine",
    significance: "significant",
    type: "counter-offensive",
    description:
      "Secondary axis of Ukraine's 2023 counteroffensive aimed toward " +
      "the Sea of Azov via Staromlynivka. Achieved only marginal gains " +
      "through heavily fortified Russian positions.",
    outcome: "Inconclusive",
    waypoints: [
      { lat: 47.7, lng: 36.7, label: "Velyka Novosilka" },
      { lat: 47.58, lng: 36.55, label: "Rivnopil" },
      { lat: 47.45, lng: 36.46, label: "Staromlynivka" },
      { lat: 47.11, lng: 36.79, label: "Berdiansk (not reached)" },
    ],
  },
  {
    id: "dnipro-bridgehead",
    name: "Dnipro Left Bank Bridgehead",
    officialName: "Krynky Bridgehead Operations",
    startDate: "20231017",
    endDate: "20240605",
    initiator: "Ukraine",
    side: "ukraine",
    significance: "significant",
    type: "offensive",
    description:
      "Ukrainian marines established a small bridgehead at Krynky on " +
      "the Russian-held left bank of the Dnipro in Kherson Oblast. " +
      "The bridgehead was eventually abandoned under heavy fire.",
    outcome: "Inconclusive",
    waypoints: [
      { lat: 46.67, lng: 32.83, label: "Kherson (right bank staging)" },
      { lat: 46.63, lng: 32.97, label: "Dnipro River crossing" },
      { lat: 46.6, lng: 33.06, label: "Krynky (left bank bridgehead)" },
    ],
  },

  // ── BATTLE OF AVDIIVKA – Oct 2023 – Feb 2024 ─────────────────────

  {
    id: "avdiivka",
    name: "Battle of Avdiivka",
    startDate: "20231010",
    endDate: "20240217",
    initiator: "Russia",
    side: "russia",
    significance: "critical",
    type: "offensive",
    description:
      "Major Russian offensive to capture fortified Avdiivka near " +
      "Donetsk city. After 4 months and massive casualties (est. " +
      "17,000 Russian KIA), Ukraine withdrew to avoid encirclement.",
    outcome: "Russian victory",
    waypoints: [
      { lat: 48.15, lng: 37.88, label: "North pincer (Stepove)" },
      { lat: 48.1, lng: 37.85, label: "South pincer (Opytne)" },
      { lat: 48.14, lng: 37.75, label: "Avdiivka (captured Feb 17)" },
      { lat: 48.14, lng: 37.63, label: "Lastochkyne (post-withdrawal)" },
    ],
  },

  // ── 2024 RUSSIAN OFFENSIVES ───────────────────────────────────────

  {
    id: "kharkiv-north-2024",
    name: "Northern Kharkiv Offensive",
    startDate: "20240510",
    endDate: "20240730",
    initiator: "Russia",
    side: "russia",
    significance: "major",
    type: "offensive",
    description:
      "Russia opened a new front north of Kharkiv, capturing the " +
      "border town of Vovchansk and threatening Kharkiv city. Ukraine " +
      "stabilized the line after committing reserves.",
    outcome: "Stalemate",
    waypoints: [
      { lat: 50.29, lng: 36.95, label: "Russia border (Belgorod)" },
      { lat: 50.29, lng: 36.94, label: "Vovchansk" },
      { lat: 50.15, lng: 36.78, label: "Lyptsi direction" },
      { lat: 50.0, lng: 36.25, label: "Kharkiv (not reached)" },
    ],
  },
  {
    id: "pokrovsk-offensive",
    name: "Pokrovsk Offensive",
    startDate: "20240718",
    endDate: "20260131",
    initiator: "Russia",
    side: "russia",
    significance: "critical",
    type: "offensive",
    description:
      "Russia's largest 2024–25 offensive, driving west from Avdiivka " +
      "toward Pokrovsk. Captured Novohrodivka, Selydove, Myrnohrad, " +
      "and ultimately Pokrovsk in early 2026.",
    outcome: "Russian victory",
    isOngoing: true,
    waypoints: [
      { lat: 48.14, lng: 37.75, label: "Avdiivka (start point)" },
      { lat: 48.21, lng: 37.47, label: "Ocheretyne" },
      { lat: 48.36, lng: 37.39, label: "Novohrodivka (fell Sep 2024)" },
      { lat: 48.15, lng: 37.3, label: "Selydove (fell Nov 2024)" },
      { lat: 48.28, lng: 37.18, label: "Myrnohrad (fell late 2025)" },
      { lat: 48.29, lng: 37.04, label: "Pokrovsk (fell early 2026)" },
    ],
  },
  {
    id: "toretsk-offensive",
    name: "Toretsk Offensive",
    startDate: "20240621",
    endDate: "20250228",
    initiator: "Russia",
    side: "russia",
    significance: "major",
    type: "offensive",
    description:
      "Russian forces advanced into Toretsk (formerly Dzerzhynsk) in " +
      "Donetsk Oblast, gradually pushing into the city through fierce " +
      "urban combat over several months.",
    outcome: "Russian victory",
    waypoints: [
      { lat: 48.42, lng: 37.96, label: "Niu-York (east of Toretsk)" },
      { lat: 48.4, lng: 37.85, label: "Eastern outskirts" },
      { lat: 48.39, lng: 37.78, label: "Toretsk center" },
    ],
  },
  {
    id: "vuhledar-capture",
    name: "Fall of Vuhledar",
    startDate: "20240901",
    endDate: "20241002",
    initiator: "Russia",
    side: "russia",
    significance: "major",
    type: "offensive",
    description:
      "After multiple failed frontal assaults since 2022, Russia " +
      "captured Vuhledar through a flanking maneuver. Ukraine " +
      "withdrew to avoid encirclement, ending a 2.5-year defense.",
    outcome: "Russian victory",
    waypoints: [
      { lat: 47.85, lng: 37.05, label: "Pavlivka (south approach)" },
      { lat: 47.82, lng: 37.18, label: "Flanking move (east)" },
      { lat: 47.78, lng: 37.25, label: "Vuhledar (captured Oct 2)" },
    ],
  },
  {
    id: "kurakhove-offensive",
    name: "Kurakhove Offensive",
    startDate: "20241016",
    endDate: "20241225",
    initiator: "Russia",
    side: "russia",
    significance: "major",
    type: "offensive",
    description:
      "Russian forces captured Kurakhove and its power station " +
      "through an encirclement from north and south, severing " +
      "Ukrainian defensive lines in western Donetsk.",
    outcome: "Russian victory",
    waypoints: [
      { lat: 48.04, lng: 37.45, label: "Maksymilyanivka (north)" },
      { lat: 47.93, lng: 37.42, label: "Southern envelopment" },
      { lat: 47.98, lng: 37.32, label: "Kurakhove (captured Dec 25)" },
    ],
  },

  // ── KURSK INCURSION – Aug 2024 – Mar 2025 ─────────────────────────

  {
    id: "kursk-incursion",
    name: "Kursk Incursion",
    officialName: "Ukrainian Incursion into Kursk Oblast",
    startDate: "20240806",
    endDate: "20250311",
    initiator: "Ukraine",
    side: "ukraine",
    significance: "critical",
    type: "incursion",
    description:
      "Surprise Ukrainian cross-border offensive into Russia's Kursk " +
      "Oblast. Captured ~1,300 km2 at peak. Russia's counterattack, " +
      "aided by North Korean troops, recaptured most territory by Mar 2025.",
    outcome: "Inconclusive",
    waypoints: [
      { lat: 51.34, lng: 34.69, label: "Sudzha border crossing" },
      { lat: 51.38, lng: 34.82, label: "Sudzha (captured Aug 2024)" },
      { lat: 51.35, lng: 35.1, label: "Korenevo direction" },
      { lat: 51.45, lng: 35.25, label: "Maximum extent of advance" },
      { lat: 51.33, lng: 35.18, label: "Snagost area" },
    ],
  },

  // ── CHASIV YAR – 2024–2025 ────────────────────────────────────────

  {
    id: "chasiv-yar",
    name: "Battle of Chasiv Yar",
    startDate: "20240401",
    endDate: "20250731",
    initiator: "Russia",
    side: "russia",
    significance: "critical",
    type: "siege",
    description:
      "Prolonged Russian assault on strategically elevated Chasiv Yar, " +
      "west of Bakhmut. Its high ground commanded surrounding terrain. " +
      "Russia finally captured it after roughly 16 months of fighting.",
    outcome: "Russian victory",
    waypoints: [
      { lat: 48.59, lng: 38.0, label: "Bakhmut (jumping off)" },
      { lat: 48.6, lng: 37.93, label: "Ivanivske" },
      { lat: 48.6, lng: 37.85, label: "Chasiv Yar (captured Jul 2025)" },
    ],
  },

  // ── 2025 OPERATIONS ───────────────────────────────────────────────

  {
    id: "sumy-offensive-2025",
    name: "2025 Sumy Offensive",
    startDate: "20250219",
    endDate: "20250626",
    initiator: "Russia",
    side: "russia",
    significance: "major",
    type: "offensive",
    description:
      "Russian forces launched an offensive into Sumy Oblast from the " +
      "Kursk region with ~50,000 troops. Captured several border " +
      "villages but failed to reach Sumy city.",
    outcome: "Inconclusive",
    waypoints: [
      { lat: 51.5, lng: 34.4, label: "Kursk Oblast (staging)" },
      { lat: 51.3, lng: 34.3, label: "Border crossing point" },
      { lat: 51.1, lng: 34.5, label: "Bilopillia direction" },
      { lat: 50.91, lng: 34.8, label: "Sumy (not reached)" },
    ],
  },
  {
    id: "luhansk-completion",
    name: "Completion of Luhansk Oblast Capture",
    startDate: "20250101",
    endDate: "20250630",
    initiator: "Russia",
    side: "russia",
    significance: "major",
    type: "offensive",
    description:
      "Russian forces methodically captured the remaining Ukrainian-held " +
      "pockets in Luhansk Oblast, completing full control of the region " +
      "by mid-2025.",
    outcome: "Russian victory",
    waypoints: [
      { lat: 49.0, lng: 37.8, label: "Siversk area" },
      { lat: 48.85, lng: 38.0, label: "Bilohorivka" },
      { lat: 48.57, lng: 38.8, label: "Remaining Ukrainian pockets" },
      { lat: 48.57, lng: 39.31, label: "Luhansk Oblast border" },
    ],
  },
];

/** @deprecated Use MILITARY_OPERATIONS instead */
export const MAJOR_OPERATIONS = MILITARY_OPERATIONS;
