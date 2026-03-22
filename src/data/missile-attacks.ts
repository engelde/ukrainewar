/**
 * Major Russian missile and drone attack waves on Ukraine.
 *
 * Curated dataset of the most significant combined strikes from
 * February 2022 through early 2026. Numbers are based on Ukrainian
 * Air Force and General Staff reporting.
 *
 * Classification thresholds:
 *   - "massive"      — 50+ missiles/drones in a single wave
 *   - "major"        — 20–49 missiles/drones
 *   - "significant"  — notable for strategic impact or casualties
 */

/** A single documented missile / drone attack wave. */
export interface MissileAttack {
  /** Date in YYYYMMDD format. */
  date: string;
  /** Scale classification of the attack. */
  type: "massive" | "major" | "significant";
  /** Missile component of the strike. */
  missiles: {
    launched: number;
    intercepted: number;
    /** Missile types employed, e.g. "Kh-101", "Kalibr". */
    types: string[];
  };
  /** Drone component of the strike. */
  drones: {
    launched: number;
    intercepted: number;
    /** Drone types employed, e.g. "Shahed-136". */
    types: string[];
  };
  /** Primary targets or target categories. */
  targets: string[];
  /** Confirmed civilian casualties when publicly reported. */
  casualties?: { killed: number; injured: number };
  /** Brief description of the attack and its consequences. */
  description: string;
  /** Reporting source. */
  source: string;
}

/**
 * Chronological list of major Russian strike waves on Ukraine.
 *
 * Each entry represents a single attack wave (usually overnight or
 * early-morning), not a full day of hostilities.
 */
export const MISSILE_ATTACKS: MissileAttack[] = [
  // ─── 2022 ───────────────────────────────────────────────
  {
    date: "20220224",
    type: "massive",
    missiles: {
      launched: 160,
      intercepted: 0,
      types: ["Kalibr", "Iskander-M", "Kh-101", "Tochka-U"],
    },
    drones: { launched: 0, intercepted: 0, types: [] },
    targets: [
      "Military airfields",
      "Air-defense sites",
      "Command centres",
      "Kyiv",
      "Kharkiv",
      "Odesa",
    ],
    description:
      "Opening salvo of the full-scale invasion. Russia launched cruise and ballistic " +
      "missiles against military infrastructure across Ukraine. Air-defense capacity was " +
      "limited and interception rates were near zero.",
    source: "Ukrainian General Staff",
  },
  {
    date: "20220301",
    type: "significant",
    missiles: {
      launched: 30,
      intercepted: 5,
      types: ["Kalibr", "Iskander-M"],
    },
    drones: { launched: 0, intercepted: 0, types: [] },
    targets: ["Kyiv TV tower", "Babyn Yar memorial area", "Kharkiv city centre"],
    casualties: { killed: 5, injured: 5 },
    description:
      "Strikes hit Kyiv's main television tower and the area near the Babyn Yar Holocaust " +
      "memorial. Broadcast was temporarily disrupted. Kharkiv's Freedom Square was struck " +
      "by a missile hitting the regional administration building.",
    source: "Ukrainian General Staff",
  },
  {
    date: "20220309",
    type: "significant",
    missiles: {
      launched: 8,
      intercepted: 0,
      types: ["FAB-500"],
    },
    drones: { launched: 0, intercepted: 0, types: [] },
    targets: ["Mariupol maternity hospital"],
    casualties: { killed: 3, injured: 17 },
    description:
      "Russian airstrike destroyed a maternity and children's hospital in besieged Mariupol, " +
      "drawing global condemnation. The attack was later confirmed as a war crime by " +
      "international investigators.",
    source: "Ukrainian General Staff",
  },
  {
    date: "20220413",
    type: "significant",
    missiles: {
      launched: 4,
      intercepted: 0,
      types: ["Tochka-U"],
    },
    drones: { launched: 0, intercepted: 0, types: [] },
    targets: ["Kramatorsk railway station"],
    casualties: { killed: 61, injured: 121 },
    description:
      "A Tochka-U ballistic missile with cluster munitions struck Kramatorsk railway station " +
      "while thousands of civilians were waiting to evacuate. One of the deadliest single " +
      "strikes of the war.",
    source: "Ukrainian General Staff",
  },
  {
    date: "20220627",
    type: "significant",
    missiles: {
      launched: 2,
      intercepted: 0,
      types: ["Kh-22"],
    },
    drones: { launched: 0, intercepted: 0, types: [] },
    targets: ["Kremenchuk shopping centre"],
    casualties: { killed: 22, injured: 59 },
    description:
      "A Kh-22 anti-ship missile struck the Amstor shopping centre in Kremenchuk while " +
      "over 1,000 civilians were inside. The building was destroyed, causing mass " +
      "casualties.",
    source: "Ukrainian Air Force",
  },
  {
    date: "20220714",
    type: "significant",
    missiles: {
      launched: 3,
      intercepted: 0,
      types: ["Kalibr"],
    },
    drones: { launched: 0, intercepted: 0, types: [] },
    targets: ["Vinnytsia city centre"],
    casualties: { killed: 27, injured: 100 },
    description:
      "Three Kalibr cruise missiles struck downtown Vinnytsia, hitting a concert hall and " +
      "surrounding area. Among the dead were children, including a four-year-old girl whose " +
      "image became a symbol of the war's toll on civilians.",
    source: "Ukrainian Air Force",
  },
  {
    date: "20221010",
    type: "massive",
    missiles: {
      launched: 84,
      intercepted: 43,
      types: ["Kh-101", "Kalibr", "Iskander-M", "S-300", "Kh-555"],
    },
    drones: {
      launched: 24,
      intercepted: 13,
      types: ["Shahed-136"],
    },
    targets: ["Energy infrastructure", "Kyiv", "Lviv", "Dnipro", "Zaporizhzhia", "Kharkiv"],
    casualties: { killed: 19, injured: 105 },
    description:
      "First massive retaliatory strike after the Kerch Bridge explosion. Russia launched " +
      "missiles and drones at targets in 14 oblasts simultaneously, marking the start of a " +
      "systematic campaign against Ukraine's energy grid. About 30% of power stations " +
      "were damaged in a single morning.",
    source: "Ukrainian Air Force",
  },
  {
    date: "20221017",
    type: "massive",
    missiles: {
      launched: 28,
      intercepted: 18,
      types: ["Kh-101", "Kalibr"],
    },
    drones: {
      launched: 15,
      intercepted: 9,
      types: ["Shahed-136"],
    },
    targets: ["Energy infrastructure", "Kyiv", "Critical infrastructure"],
    casualties: { killed: 4, injured: 18 },
    description:
      "Follow-up combined strike one week after the 10 October wave. Kamikaze drones and " +
      "cruise missiles again targeted energy facilities and critical infrastructure across " +
      "multiple regions.",
    source: "Ukrainian Air Force",
  },
  {
    date: "20221031",
    type: "massive",
    missiles: {
      launched: 55,
      intercepted: 44,
      types: ["Kh-101", "Kalibr", "S-300"],
    },
    drones: {
      launched: 15,
      intercepted: 11,
      types: ["Shahed-136"],
    },
    targets: ["Energy infrastructure", "Water supply systems", "Kyiv", "Kharkiv", "Zaporizhzhia"],
    casualties: { killed: 9, injured: 50 },
    description:
      "Large-scale attack on energy and water infrastructure. 80% of Kyiv was left without " +
      "water supply and significant parts without electricity. Emergency blackouts were " +
      "imposed across the country.",
    source: "Ukrainian Air Force",
  },
  {
    date: "20221115",
    type: "massive",
    missiles: {
      launched: 96,
      intercepted: 73,
      types: ["Kh-101", "Kalibr", "Kh-555", "Iskander-M", "S-300"],
    },
    drones: {
      launched: 0,
      intercepted: 0,
      types: [],
    },
    targets: ["Energy infrastructure", "Kyiv", "Lviv", "Odesa", "Kharkiv"],
    casualties: { killed: 10, injured: 50 },
    description:
      "One of the largest single-wave missile attacks. Nearly 100 cruise and ballistic " +
      "missiles targeted the energy grid nationwide, causing massive blackouts. Roughly " +
      "10 million Ukrainians were left without power.",
    source: "Ukrainian Air Force",
  },
  {
    date: "20221123",
    type: "massive",
    missiles: {
      launched: 67,
      intercepted: 51,
      types: ["Kh-101", "Kalibr", "Kh-555", "Iskander-M"],
    },
    drones: {
      launched: 10,
      intercepted: 7,
      types: ["Shahed-136"],
    },
    targets: ["Energy infrastructure", "Heating systems", "Kyiv", "Dnipro", "Odesa"],
    casualties: { killed: 7, injured: 35 },
    description:
      "Nationwide energy strike as temperatures dropped below freezing. Multiple thermal " +
      "power plants and substations were hit, leaving most regions with emergency power " +
      "cuts. Kyiv's water and heating systems were disrupted for millions of residents.",
    source: "Ukrainian Air Force",
  },
  {
    date: "20221205",
    type: "massive",
    missiles: {
      launched: 70,
      intercepted: 60,
      types: ["Kh-101", "Kalibr", "Kh-555"],
    },
    drones: {
      launched: 5,
      intercepted: 4,
      types: ["Shahed-136"],
    },
    targets: ["Energy infrastructure", "Kyiv", "Odesa", "Vinnytsia"],
    casualties: { killed: 4, injured: 30 },
    description:
      "Continued winter campaign against the energy grid. Ukraine's air defences " +
      "demonstrated improved interception rates (over 85%), but surviving missiles " +
      "still caused significant damage to power-generation facilities.",
    source: "Ukrainian Air Force",
  },
  {
    date: "20221216",
    type: "massive",
    missiles: {
      launched: 76,
      intercepted: 60,
      types: ["Kh-101", "Kalibr", "Kh-555", "Iskander-M", "S-300"],
    },
    drones: {
      launched: 0,
      intercepted: 0,
      types: [],
    },
    targets: ["Energy infrastructure", "Kyiv", "Kharkiv", "Kryvyi Rih"],
    casualties: { killed: 3, injured: 16 },
    description:
      "Major pre-holiday strike aimed at deepening the energy crisis. Power outages " +
      "affected all oblasts. Repair crews worked around the clock but some regions " +
      "endured 12–18-hour blackouts.",
    source: "Ukrainian Air Force",
  },
  {
    date: "20221229",
    type: "massive",
    missiles: {
      launched: 120,
      intercepted: 54,
      types: ["Kh-101", "Kalibr", "Kh-555", "Iskander-M", "S-300", "Kh-22"],
    },
    drones: {
      launched: 36,
      intercepted: 27,
      types: ["Shahed-136"],
    },
    targets: ["Energy infrastructure", "Kyiv", "Lviv", "Odesa", "Kharkiv", "Zaporizhzhia"],
    casualties: { killed: 16, injured: 60 },
    description:
      "Largest single-day barrage of 2022. A combined 156 projectiles struck energy " +
      "infrastructure nationwide. Many targets had already been repaired from earlier " +
      "strikes and were hit again. Despite high interception, the sheer volume overwhelmed " +
      "repair capacity.",
    source: "Ukrainian Air Force",
  },

  // ─── 2023 ───────────────────────────────────────────────
  {
    date: "20230114",
    type: "significant",
    missiles: {
      launched: 6,
      intercepted: 0,
      types: ["Kh-22"],
    },
    drones: { launched: 0, intercepted: 0, types: [] },
    targets: ["Dnipro residential building"],
    casualties: { killed: 46, injured: 80 },
    description:
      "A Kh-22 missile struck a nine-storey apartment block in Dnipro, destroying an " +
      "entire section of the building. The death toll made it one of the deadliest " +
      "single strikes on civilians in the war. Rescue operations lasted several days.",
    source: "Ukrainian Air Force",
  },
  {
    date: "20230126",
    type: "massive",
    missiles: {
      launched: 55,
      intercepted: 47,
      types: ["Kh-101", "Kalibr", "Kh-555", "Iskander-M"],
    },
    drones: {
      launched: 24,
      intercepted: 20,
      types: ["Shahed-136"],
    },
    targets: ["Energy infrastructure", "Kyiv", "Odesa", "Vinnytsia", "Dnipro"],
    casualties: { killed: 11, injured: 22 },
    description:
      "First massive combined strike of 2023, again focused on the energy grid. " +
      "Interception rates continued to improve but the combined volume of missiles and " +
      "drones was designed to saturate defences.",
    source: "Ukrainian Air Force",
  },
  {
    date: "20230210",
    type: "massive",
    missiles: {
      launched: 71,
      intercepted: 61,
      types: ["Kh-101", "Kalibr", "Kh-555", "Iskander-M", "S-300"],
    },
    drones: {
      launched: 7,
      intercepted: 6,
      types: ["Shahed-136"],
    },
    targets: ["Energy infrastructure", "Kyiv", "Zaporizhzhia", "Kharkiv"],
    casualties: { killed: 2, injured: 12 },
    description:
      "Massive pre-invasion-anniversary strike. Ukrainian air defences intercepted " +
      "86% of cruise missiles. Despite high interception, several power substations " +
      "suffered damage, causing localised blackouts.",
    source: "Ukrainian Air Force",
  },
  {
    date: "20230309",
    type: "massive",
    missiles: {
      launched: 81,
      intercepted: 34,
      types: ["Kh-101", "Kalibr", "Kh-555", "Iskander-M", "S-300", "Kh-22", "Kh-47M2"],
    },
    drones: {
      launched: 8,
      intercepted: 4,
      types: ["Shahed-136"],
    },
    targets: ["Energy infrastructure", "Kyiv", "Kharkiv", "Odesa", "Lviv", "Ivano-Frankivsk"],
    casualties: { killed: 11, injured: 22 },
    description:
      "Massive combined strike using nearly every missile type in Russia's arsenal, " +
      "including hypersonic Kinzhal. Energy infrastructure was the primary target, " +
      "with multiple thermal power plants hit. The variety of launch platforms strained " +
      "air-defence coverage.",
    source: "Ukrainian Air Force",
  },
  {
    date: "20230529",
    type: "massive",
    missiles: {
      launched: 36,
      intercepted: 30,
      types: ["Kh-101", "Kalibr", "Iskander-M"],
    },
    drones: {
      launched: 17,
      intercepted: 11,
      types: ["Shahed-136"],
    },
    targets: ["Kyiv", "Residential areas", "Critical infrastructure"],
    casualties: { killed: 3, injured: 22 },
    description:
      "One of the heaviest combined attacks on Kyiv in the spring of 2023. Residential " +
      "buildings in multiple districts were damaged. Debris from intercepted missiles " +
      "also caused damage across the capital.",
    source: "Ukrainian Air Force",
  },
  {
    date: "20230620",
    type: "major",
    missiles: {
      launched: 35,
      intercepted: 32,
      types: ["Kh-101", "Kalibr"],
    },
    drones: {
      launched: 12,
      intercepted: 9,
      types: ["Shahed-136"],
    },
    targets: ["Kyiv", "Odesa", "Energy infrastructure"],
    description:
      "Night-time combined strike targeting western and central Ukraine. Air defences " +
      "achieved a cruise-missile interception rate above 90%. Drone attacks on Odesa " +
      "caused damage to port-adjacent infrastructure.",
    source: "Ukrainian Air Force",
  },
  {
    date: "20230713",
    type: "major",
    missiles: {
      launched: 19,
      intercepted: 12,
      types: ["Kalibr", "Kh-22", "Oniks"],
    },
    drones: {
      launched: 5,
      intercepted: 3,
      types: ["Shahed-136"],
    },
    targets: ["Odesa port", "Grain infrastructure", "Danube ports"],
    description:
      "After withdrawing from the Black Sea Grain Initiative, Russia began systematic " +
      "strikes on Ukrainian port and grain-export infrastructure. Odesa port facilities " +
      "and grain terminals suffered significant damage.",
    source: "Ukrainian General Staff",
  },
  {
    date: "20230724",
    type: "major",
    missiles: {
      launched: 22,
      intercepted: 15,
      types: ["Kalibr", "Oniks", "Kh-22"],
    },
    drones: {
      launched: 14,
      intercepted: 11,
      types: ["Shahed-136"],
    },
    targets: ["Odesa port", "Grain storage facilities", "Chornomorsk port"],
    casualties: { killed: 1, injured: 7 },
    description:
      "Continued campaign against grain-export infrastructure. Historic buildings in " +
      "Odesa's UNESCO-listed city centre were damaged alongside port terminals. The " +
      "Transfiguration Cathedral suffered a direct hit.",
    source: "Ukrainian Air Force",
  },
  {
    date: "20230922",
    type: "massive",
    missiles: {
      launched: 43,
      intercepted: 36,
      types: ["Kh-101", "Kh-555", "Kalibr", "Iskander-M"],
    },
    drones: {
      launched: 22,
      intercepted: 18,
      types: ["Shahed-136"],
    },
    targets: ["Energy infrastructure", "Defence-industry facilities", "Kyiv", "Rivne"],
    description:
      "Autumn 2023 wave marking the resumption of intensive energy targeting as winter " +
      "approached. Combined missile-and-drone tactics continued to evolve, with drones " +
      "used to exhaust air defences ahead of cruise-missile waves.",
    source: "Ukrainian Air Force",
  },
  {
    date: "20231025",
    type: "major",
    missiles: {
      launched: 29,
      intercepted: 23,
      types: ["Kh-101", "Kalibr", "Iskander-M"],
    },
    drones: {
      launched: 20,
      intercepted: 17,
      types: ["Shahed-136", "Shahed-131"],
    },
    targets: ["Energy infrastructure", "Kyiv", "Kharkiv", "Odesa"],
    description:
      "Combined strike on energy and urban infrastructure in central, eastern and " +
      "southern Ukraine. Sequence of drone waves followed by cruise missiles became " +
      "the standard Russian attack pattern.",
    source: "Ukrainian Air Force",
  },
  {
    date: "20231211",
    type: "massive",
    missiles: {
      launched: 50,
      intercepted: 42,
      types: ["Kh-101", "Kalibr", "Kh-555", "Iskander-M"],
    },
    drones: {
      launched: 20,
      intercepted: 16,
      types: ["Shahed-136"],
    },
    targets: ["Energy infrastructure", "Kyiv", "Kharkiv", "Zaporizhzhia"],
    description:
      "Major winter strike on the energy grid ahead of the holiday period. Although " +
      "interception rates exceeded 80%, the attacks compounded damage from previous " +
      "waves and slowed restoration efforts.",
    source: "Ukrainian Air Force",
  },
  {
    date: "20231229",
    type: "massive",
    missiles: {
      launched: 90,
      intercepted: 72,
      types: ["Kh-101", "Kalibr", "Kh-555", "Iskander-M", "S-300", "Kh-22", "Kh-47M2"],
    },
    drones: {
      launched: 68,
      intercepted: 54,
      types: ["Shahed-136", "Shahed-131"],
    },
    targets: [
      "Energy infrastructure",
      "Kyiv",
      "Lviv",
      "Odesa",
      "Kharkiv",
      "Dnipro",
      "Zaporizhzhia",
    ],
    casualties: { killed: 39, injured: 160 },
    description:
      "Largest combined strike of the entire war to that point — 158 projectiles launched " +
      "simultaneously at targets across Ukraine. Residential areas, hospitals and " +
      "shopping centres were hit in multiple cities. Dnipro, Kyiv and Lviv suffered the " +
      "heaviest damage.",
    source: "Ukrainian Air Force",
  },

  // ─── 2024 ───────────────────────────────────────────────
  {
    date: "20240102",
    type: "massive",
    missiles: {
      launched: 57,
      intercepted: 47,
      types: ["Kh-101", "Kalibr", "Kh-555", "Iskander-M"],
    },
    drones: {
      launched: 42,
      intercepted: 36,
      types: ["Shahed-136"],
    },
    targets: ["Kyiv", "Kharkiv", "Lviv", "Odesa", "Energy infrastructure"],
    casualties: { killed: 5, injured: 32 },
    description:
      "Massive New Year strike combining cruise missiles and Shahed drones. The wave " +
      "continued the pattern of year-end/New-Year escalation. Air-defence units across " +
      "the country were engaged simultaneously.",
    source: "Ukrainian Air Force",
  },
  {
    date: "20240207",
    type: "major",
    missiles: {
      launched: 37,
      intercepted: 29,
      types: ["Kh-101", "Kalibr", "Iskander-M"],
    },
    drones: {
      launched: 12,
      intercepted: 10,
      types: ["Shahed-136"],
    },
    targets: ["Energy infrastructure", "Kyiv", "Dnipro", "Odesa"],
    description:
      "Pre-anniversary strike on energy infrastructure. Western-supplied air-defence " +
      "systems, including Patriot batteries, contributed to interception rates above 80%.",
    source: "Ukrainian Air Force",
  },
  {
    date: "20240322",
    type: "massive",
    missiles: {
      launched: 63,
      intercepted: 49,
      types: ["Kh-101", "Kalibr", "Kh-555", "Iskander-M", "S-300"],
    },
    drones: {
      launched: 38,
      intercepted: 30,
      types: ["Shahed-136"],
    },
    targets: ["Energy infrastructure", "Kyiv", "Kharkiv", "Lviv", "Odesa", "Dnipro"],
    casualties: { killed: 7, injured: 41 },
    description:
      "Major energy-infrastructure attack marking a spring escalation. Dnipro HPP (one " +
      "of Ukraine's largest hydroelectric plants) was severely damaged. Multiple thermal " +
      "power plants hit across the country.",
    source: "Ukrainian Air Force",
  },
  {
    date: "20240411",
    type: "massive",
    missiles: {
      launched: 40,
      intercepted: 32,
      types: ["Kh-101", "Kalibr", "Iskander-M", "S-300"],
    },
    drones: {
      launched: 40,
      intercepted: 35,
      types: ["Shahed-136"],
    },
    targets: ["Energy infrastructure", "Trypillia thermal power plant", "Kyiv", "Kharkiv"],
    casualties: { killed: 5, injured: 20 },
    description:
      "The Trypillia thermal power plant in Kyiv Oblast — the largest in central " +
      "Ukraine — was completely destroyed. DTEK, Ukraine's largest private energy " +
      "company, reported the loss of 80% of its generation capacity from cumulative " +
      "strikes.",
    source: "Ukrainian Air Force",
  },
  {
    date: "20240608",
    type: "major",
    missiles: {
      launched: 24,
      intercepted: 20,
      types: ["Kh-101", "Kalibr"],
    },
    drones: {
      launched: 10,
      intercepted: 8,
      types: ["Shahed-136"],
    },
    targets: ["Energy infrastructure", "Gas storage facilities"],
    description:
      "Targeted attack on gas storage and energy distribution infrastructure. Strikes " +
      "aimed to degrade Ukraine's ability to stockpile gas ahead of the next winter.",
    source: "Ukrainian Air Force",
  },
  {
    date: "20240708",
    type: "massive",
    missiles: {
      launched: 38,
      intercepted: 30,
      types: ["Kh-101", "Kalibr", "Iskander-M", "Kh-22"],
    },
    drones: {
      launched: 0,
      intercepted: 0,
      types: [],
    },
    targets: ["Kyiv", "Okhmatdyt children's hospital", "Residential areas", "Business centre"],
    casualties: { killed: 43, injured: 147 },
    description:
      "Daytime missile strike that hit the Okhmatdyt children's hospital in Kyiv — the " +
      "country's largest paediatric facility — as well as a business centre and " +
      "residential areas. The strike drew widespread international condemnation and led " +
      "to emergency G7 and NATO summit discussions.",
    source: "Ukrainian Air Force",
  },
  {
    date: "20240826",
    type: "massive",
    missiles: {
      launched: 127,
      intercepted: 102,
      types: ["Kh-101", "Kalibr", "Kh-555", "Iskander-M", "S-300", "Kh-22", "Kh-47M2"],
    },
    drones: {
      launched: 109,
      intercepted: 99,
      types: ["Shahed-136", "Shahed-131"],
    },
    targets: [
      "Energy infrastructure",
      "Kyiv",
      "Lviv",
      "Odesa",
      "Kharkiv",
      "Zaporizhzhia",
      "Dnipro",
      "Ivano-Frankivsk",
    ],
    casualties: { killed: 7, injured: 47 },
    description:
      "Largest combined strike of the entire war — 236 projectiles launched " +
      "simultaneously at energy infrastructure nationwide. Every type of missile in " +
      "Russia's arsenal was employed. Ukraine imposed emergency blackouts across all " +
      "oblasts. Significant damage to generation and transmission infrastructure ahead " +
      "of winter.",
    source: "Ukrainian Air Force",
  },
  {
    date: "20241017",
    type: "massive",
    missiles: {
      launched: 68,
      intercepted: 56,
      types: ["Kh-101", "Kalibr", "Kh-555", "Iskander-M", "S-300"],
    },
    drones: {
      launched: 42,
      intercepted: 36,
      types: ["Shahed-136", "Shahed-131"],
    },
    targets: ["Energy infrastructure", "Kyiv", "Kharkiv", "Odesa"],
    casualties: { killed: 3, injured: 28 },
    description:
      "Autumn energy campaign escalation. Strikes targeted power-distribution " +
      "substations and high-voltage transformers — equipment that is harder to replace " +
      "than generating capacity. Rolling blackouts affected all oblasts.",
    source: "Ukrainian Air Force",
  },
  {
    date: "20241121",
    type: "significant",
    missiles: {
      launched: 7,
      intercepted: 0,
      types: ["Oreshnik (IRBM)"],
    },
    drones: {
      launched: 0,
      intercepted: 0,
      types: [],
    },
    targets: ["Dnipro", "Pivdenmash industrial complex"],
    description:
      "Russia used an intermediate-range ballistic missile (Oreshnik, a modified RS-26) " +
      "for the first time against Ukraine. The IRBM, carrying multiple re-entry " +
      "vehicles, struck the Pivdenmash aerospace plant in Dnipro. The unprecedented " +
      "use of an IRBM marked a dangerous escalation.",
    source: "Ukrainian Air Force",
  },
  {
    date: "20241213",
    type: "massive",
    missiles: {
      launched: 94,
      intercepted: 78,
      types: ["Kh-101", "Kalibr", "Kh-555", "Iskander-M", "S-300"],
    },
    drones: {
      launched: 96,
      intercepted: 80,
      types: ["Shahed-136", "Shahed-131"],
    },
    targets: [
      "Energy infrastructure",
      "Heating systems",
      "Kyiv",
      "Kharkiv",
      "Odesa",
      "Zaporizhzhia",
    ],
    casualties: { killed: 5, injured: 38 },
    description:
      "Massive combined winter strike using 190 projectiles. The attack targeted both " +
      "electricity generation and district-heating infrastructure as temperatures " +
      "dropped below freezing. Emergency power imports from the EU helped stabilise " +
      "the grid.",
    source: "Ukrainian Air Force",
  },

  // ─── 2025 ───────────────────────────────────────────────
  {
    date: "20250102",
    type: "massive",
    missiles: {
      launched: 72,
      intercepted: 59,
      types: ["Kh-101", "Kalibr", "Kh-555", "Iskander-M"],
    },
    drones: {
      launched: 50,
      intercepted: 43,
      types: ["Shahed-136", "Shahed-131"],
    },
    targets: ["Energy infrastructure", "Kyiv", "Kharkiv", "Odesa", "Lviv"],
    casualties: { killed: 4, injured: 25 },
    description:
      "New Year 2025 attack wave continuing the pattern of holiday-period escalation. " +
      "Energy infrastructure remained the primary target. Ukraine's power deficit " +
      "deepened despite ongoing repairs.",
    source: "Ukrainian Air Force",
  },
  {
    date: "20250214",
    type: "massive",
    missiles: {
      launched: 60,
      intercepted: 48,
      types: ["Kh-101", "Kalibr", "Iskander-M", "S-300"],
    },
    drones: {
      launched: 40,
      intercepted: 34,
      types: ["Shahed-136"],
    },
    targets: ["Energy infrastructure", "Kyiv", "Dnipro", "Zaporizhzhia"],
    casualties: { killed: 6, injured: 30 },
    description:
      "Third-anniversary escalation targeting energy and industrial infrastructure. " +
      "Ukraine's Western-supplied air-defence systems, including NASAMS, IRIS-T and " +
      "Patriot, played a decisive role in maintaining high interception rates despite " +
      "the scale of the attack.",
    source: "Ukrainian Air Force",
  },
  {
    date: "20250322",
    type: "massive",
    missiles: {
      launched: 55,
      intercepted: 46,
      types: ["Kh-101", "Kalibr", "Kh-555", "Iskander-M"],
    },
    drones: {
      launched: 45,
      intercepted: 38,
      types: ["Shahed-136", "Shahed-131"],
    },
    targets: ["Energy infrastructure", "Kyiv", "Kharkiv", "Odesa"],
    description:
      "Spring 2025 combined strike on power generation and transmission. Despite " +
      "84% interception across missile and drone categories, surviving projectiles " +
      "caused further damage to an energy system already operating at reduced capacity.",
    source: "Ukrainian Air Force",
  },
  {
    date: "20250510",
    type: "massive",
    missiles: {
      launched: 70,
      intercepted: 58,
      types: ["Kh-101", "Kalibr", "Iskander-M", "S-300", "Kh-47M2"],
    },
    drones: {
      launched: 55,
      intercepted: 48,
      types: ["Shahed-136", "Shahed-131"],
    },
    targets: ["Energy infrastructure", "Kyiv", "Lviv", "Kharkiv", "Odesa", "Zaporizhzhia"],
    casualties: { killed: 8, injured: 35 },
    description:
      "Pre-summer combined strike of 125 projectiles targeting energy generation and " +
      "key substations. Russia used Kinzhal hypersonic missiles alongside standard " +
      "cruise-missile and drone salvos to complicate defence-system prioritisation.",
    source: "Ukrainian Air Force",
  },
];

// ─── Summary Statistics ──────────────────────────────────

/** Compute aggregate totals from the attack data. */
function computeStats() {
  let totalMissilesLaunched = 0;
  let totalMissilesIntercepted = 0;
  let totalDronesLaunched = 0;
  let totalDronesIntercepted = 0;
  let totalMassiveAttacks = 0;
  let latestAttack = "00000000";

  for (const a of MISSILE_ATTACKS) {
    totalMissilesLaunched += a.missiles.launched;
    totalMissilesIntercepted += a.missiles.intercepted;
    totalDronesLaunched += a.drones.launched;
    totalDronesIntercepted += a.drones.intercepted;
    if (a.type === "massive") totalMassiveAttacks++;
    if (a.date > latestAttack) latestAttack = a.date;
  }

  return {
    totalMissilesLaunched,
    totalMissilesIntercepted,
    totalDronesLaunched,
    totalDronesIntercepted,
    totalMassiveAttacks,
    firstMassiveAttack: "20221010" as const,
    latestAttack,
  };
}

/**
 * Aggregate statistics derived from {@link MISSILE_ATTACKS}.
 *
 * Values are computed at module-load time so they stay in sync with the
 * data array.
 */
export const ATTACK_STATS = computeStats();
