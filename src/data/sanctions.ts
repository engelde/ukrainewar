/**
 * Curated sanctions dataset for the Russo-Ukrainian War tracker.
 *
 * Sources: EU Council, US Treasury OFAC, UK Government, official gazettes.
 * Numbers are approximate and reflect the state at package adoption.
 * Future: integrate with OpenSanctions API for live data.
 */

export interface SanctionsPackage {
  id: string;
  date: string; // YYYYMMDD
  imposedBy: string;
  packageName: string;
  description: string;
  targets: {
    individuals: number;
    entities: number;
  };
  keyMeasures: string[];
  source?: string;
}

export interface SanctionsSummary {
  totalPackages: number;
  totalIndividualsSanctioned: number;
  totalEntitiesSanctioned: number;
  byImposer: Record<string, number>;
  keyBans: string[];
}

export const SANCTIONS_PACKAGES: SanctionsPackage[] = [
  // ── EU Sanctions ──────────────────────────────────────────────────────────
  {
    id: "eu-1",
    date: "20220223",
    imposedBy: "EU",
    packageName: "EU 1st Sanctions Package",
    description:
      "Response to Russia's recognition of Donetsk and Luhansk as independent entities. " +
      "Targeted officials and entities involved in the recognition decision.",
    targets: { individuals: 351, entities: 27 },
    keyMeasures: [
      "Asset freezes on 351 Duma members who voted for recognition",
      "Sanctions on banks financing Russian military operations in Donbas",
      "Restrictions on trade with Donetsk and Luhansk non-government-controlled areas",
    ],
    source: "https://www.consilium.europa.eu/en/press/press-releases/2022/02/23/",
  },
  {
    id: "eu-2",
    date: "20220225",
    imposedBy: "EU",
    packageName: "EU 2nd Sanctions Package",
    description:
      "Major escalation after full-scale invasion. Froze Russian Central Bank assets " +
      "and disconnected key Russian banks from SWIFT.",
    targets: { individuals: 26, entities: 7 },
    keyMeasures: [
      "Freeze of Russian Central Bank reserves held in the EU (~€300B globally)",
      "Removal of seven major Russian banks from SWIFT",
      "Ban on transactions with Russian Central Bank",
      "Sanctions on Putin, Lavrov, and senior officials",
    ],
    source: "https://www.consilium.europa.eu/en/press/press-releases/2022/02/25/",
  },
  {
    id: "eu-3",
    date: "20220228",
    imposedBy: "EU",
    packageName: "EU 3rd Sanctions Package",
    description:
      "Closed EU airspace to Russian aircraft, banned RT and Sputnik, " +
      "and extended financial sanctions.",
    targets: { individuals: 26, entities: 1 },
    keyMeasures: [
      "Complete closure of EU airspace to Russian-owned or registered aircraft",
      "Ban on RT and Sputnik broadcasts in the EU",
      "Prohibition on supplying euro-denominated banknotes to Russia",
    ],
    source: "https://www.consilium.europa.eu/en/press/press-releases/2022/02/28/",
  },
  {
    id: "eu-4",
    date: "20220315",
    imposedBy: "EU",
    packageName: "EU 4th Sanctions Package",
    description:
      "Wide-ranging trade restrictions including a luxury goods export ban " +
      "and import bans on steel products. Extended to Belarus.",
    targets: { individuals: 15, entities: 9 },
    keyMeasures: [
      "Ban on export of luxury goods to Russia (>€300 per item)",
      "Import ban on Russian iron and steel products",
      "Ban on new EU investment in the Russian energy sector",
      "Sanctions on additional oligarchs and their family members",
    ],
    source: "https://www.consilium.europa.eu/en/press/press-releases/2022/03/15/",
  },
  {
    id: "eu-5",
    date: "20220408",
    imposedBy: "EU",
    packageName: "EU 5th Sanctions Package",
    description:
      "First energy-sector ban — phased embargo on Russian coal imports. " +
      "Closed EU ports to Russian-flagged vessels.",
    targets: { individuals: 217, entities: 18 },
    keyMeasures: [
      "Full import ban on Russian coal (phased in by August 2022, ~€8B/year)",
      "Closure of EU ports to Russian-flagged vessels",
      "Ban on Russian road transport operators in the EU",
      "Additional export bans on quantum computing and advanced semiconductors",
    ],
    source: "https://www.consilium.europa.eu/en/press/press-releases/2022/04/08/",
  },
  {
    id: "eu-6",
    date: "20220603",
    imposedBy: "EU",
    packageName: "EU 6th Sanctions Package",
    description:
      "Partial oil embargo covering seaborne crude and refined products. " +
      "Disconnected Sberbank from SWIFT.",
    targets: { individuals: 65, entities: 18 },
    keyMeasures: [
      "Embargo on ~90% of Russian oil imports by end of 2022",
      "Sberbank, Credit Bank of Moscow, and Russian Agricultural Bank cut from SWIFT",
      "Ban on providing accounting, PR, and consulting services to Russia",
    ],
    source: "https://www.consilium.europa.eu/en/press/press-releases/2022/06/03/",
  },
  {
    id: "eu-7",
    date: "20220721",
    imposedBy: "EU",
    packageName: "EU 7th Sanctions Package",
    description:
      "Gold import ban and tightening of export controls. " + "Alignment with G7 gold embargo.",
    targets: { individuals: 54, entities: 10 },
    keyMeasures: [
      "Import ban on Russian gold (aligned with G7)",
      "Extended export controls on dual-use goods and advanced technology",
      "Tighter restrictions on Russian state-owned enterprises",
    ],
    source: "https://www.consilium.europa.eu/en/press/press-releases/2022/07/21/",
  },
  {
    id: "eu-8",
    date: "20221006",
    imposedBy: "EU",
    packageName: "EU 8th Sanctions Package",
    description:
      "Legal framework for Russian oil price cap adopted. " +
      "Response to illegal annexation of four Ukrainian regions.",
    targets: { individuals: 30, entities: 7 },
    keyMeasures: [
      "Legal basis for G7/EU oil price cap on Russian seaborne crude ($60/bbl)",
      "Additional import bans (steel, wood pulp, paper, cigarettes, plastics)",
      "Ban on EU citizens serving on Russian state-owned enterprise boards",
      "Sanctions on officials involved in sham referenda",
    ],
    source: "https://www.consilium.europa.eu/en/press/press-releases/2022/10/06/",
  },
  {
    id: "eu-9",
    date: "20221216",
    imposedBy: "EU",
    packageName: "EU 9th Sanctions Package",
    description:
      "Expanded trade restrictions and media bans. " +
      "Targeted key actors in Russia's military-industrial complex.",
    targets: { individuals: 141, entities: 36 },
    keyMeasures: [
      "Ban on three additional Russian state-owned broadcasters",
      "New export restrictions on drone engines and chemical precursors",
      "Additional restrictions on dual-use goods and advanced tech",
      "Sanctions on Russian military-industrial complex entities",
    ],
    source: "https://www.consilium.europa.eu/en/press/press-releases/2022/12/16/",
  },
  {
    id: "eu-10",
    date: "20230225",
    imposedBy: "EU",
    packageName: "EU 10th Sanctions Package",
    description:
      "One-year anniversary package. Major focus on countering sanctions evasion " +
      "and restricting technology access.",
    targets: { individuals: 87, entities: 34 },
    keyMeasures: [
      "New reporting obligations to counter sanctions circumvention",
      "Ban on transit of dual-use and advanced technology goods through Russia",
      "Additional restrictions on electronics and tech components",
      "Sanctions on Iranian entities supplying drones to Russia",
    ],
    source: "https://www.consilium.europa.eu/en/press/press-releases/2023/02/25/",
  },
  {
    id: "eu-11",
    date: "20230623",
    imposedBy: "EU",
    packageName: "EU 11th Sanctions Package",
    description:
      "Strongest anti-circumvention measures yet. New instrument to sanction " +
      "third-country entities facilitating evasion.",
    targets: { individuals: 71, entities: 33 },
    keyMeasures: [
      "New anti-circumvention tool to sanction third-country facilitators",
      "Export ban on additional critical technology and industrial items",
      "Expanded IP restrictions preventing Russian access to EU software",
      "Reinforced enforcement on oil price cap",
    ],
    source: "https://www.consilium.europa.eu/en/press/press-releases/2023/06/23/",
  },
  {
    id: "eu-12",
    date: "20231218",
    imposedBy: "EU",
    packageName: "EU 12th Sanctions Package",
    description:
      "Diamond import ban and further restrictions on Russian revenues. " +
      "First direct restrictions on Russian diamonds via G7 framework.",
    targets: { individuals: 61, entities: 86 },
    keyMeasures: [
      "Phased ban on Russian diamond imports (direct and indirect, from Jan 2024)",
      "Import ban on Russian LPG (liquefied petroleum gas)",
      "Restrictions on Russian metals (copper, aluminium, wire)",
      "Sanctions on entities in Russia, India, China, and Turkey aiding evasion",
    ],
    source: "https://www.consilium.europa.eu/en/press/press-releases/2023/12/18/",
  },
  {
    id: "eu-13",
    date: "20240223",
    imposedBy: "EU",
    packageName: "EU 13th Sanctions Package",
    description:
      "Two-year anniversary package. Targeted Russia's military-industrial complex " +
      "and third-country circumvention networks.",
    targets: { individuals: 106, entities: 88 },
    keyMeasures: [
      "Sanctions on 27 entities across third countries for circumvention",
      "Additional designations of Russian defence-sector companies",
      "Expanded export restrictions on battlefield goods",
      "Measures against entities in China, India, Kazakhstan, and Türkiye",
    ],
    source: "https://www.consilium.europa.eu/en/press/press-releases/2024/02/23/",
  },
  {
    id: "eu-14",
    date: "20240624",
    imposedBy: "EU",
    packageName: "EU 14th Sanctions Package",
    description:
      "First restrictions on Russian LNG re-exports via EU ports. " +
      "Major expansion of designated entities.",
    targets: { individuals: 69, entities: 47 },
    keyMeasures: [
      "Ban on re-export of Russian LNG via EU territory to third countries",
      "Prohibition on new investment in LNG projects under construction in Russia",
      "Restrictions on 27 additional vessels in Russia's shadow oil fleet",
      "Tightened provisions on transit of dual-use goods",
    ],
    source: "https://www.consilium.europa.eu/en/press/press-releases/2024/06/24/",
  },

  // ── US Sanctions ──────────────────────────────────────────────────────────
  {
    id: "us-eo14024-expansion",
    date: "20220222",
    imposedBy: "US",
    packageName: "US Executive Order 14065 — Donetsk/Luhansk",
    description:
      "Prohibited new investment, trade, and financing in the so-called DNR/LNR " +
      "regions following Russia's recognition.",
    targets: { individuals: 0, entities: 0 },
    keyMeasures: [
      "Prohibited new investment in and trade with DNR/LNR",
      "Blocked all property of persons operating in those regions",
      "Set the stage for broader sanctions after invasion",
    ],
    source: "https://home.treasury.gov/news/press-releases/jy0602",
  },
  {
    id: "us-feb2022",
    date: "20220224",
    imposedBy: "US",
    packageName: "US Full Blocking Sanctions — Invasion Response",
    description:
      "Sweeping sanctions on Russia's largest financial institutions, " +
      "sovereign debt, and elites. Froze Russian Central Bank assets.",
    targets: { individuals: 24, entities: 80 },
    keyMeasures: [
      "Full blocking sanctions on Sberbank, VTB, and other major banks",
      "Freeze of Russian Central Bank assets in US jurisdiction",
      "Sanctions on Putin, Lavrov, and Security Council members",
      "Correspondent banking restrictions cutting Russia from USD clearing",
    ],
    source: "https://home.treasury.gov/news/press-releases/jy0608",
  },
  {
    id: "us-oil-ban",
    date: "20220308",
    imposedBy: "US",
    packageName: "US EO 14066 — Russian Energy Import Ban",
    description: "Banned import of Russian crude oil, LNG, and coal into the United States.",
    targets: { individuals: 0, entities: 0 },
    keyMeasures: [
      "Complete ban on import of Russian crude oil and petroleum products",
      "Ban on Russian LNG and coal imports",
      "Prohibition on new US investment in Russia's energy sector",
    ],
    source: "https://home.treasury.gov/news/press-releases/jy0637",
  },
  {
    id: "us-oligarchs-apr2022",
    date: "20220406",
    imposedBy: "US",
    packageName: "US Oligarch & Financial Sanctions Expansion",
    description:
      "Major expansion targeting oligarchs, Sberbank, and Alfa-Bank. " +
      "Prohibited new US investment in Russia.",
    targets: { individuals: 15, entities: 24 },
    keyMeasures: [
      "Full blocking sanctions on Sberbank and Alfa-Bank",
      "Sanctions on Putin's adult children and Lavrov's family",
      "Prohibition on all new US investment in Russia",
      "Designations of key Kremlin-linked oligarchs",
    ],
    source: "https://home.treasury.gov/news/press-releases/jy0705",
  },
  {
    id: "us-export-controls",
    date: "20220224",
    imposedBy: "US",
    packageName: "US Export Controls — Advanced Technology",
    description:
      "Bureau of Industry and Security imposed sweeping export controls " +
      "on semiconductors, computers, and telecom equipment to Russia.",
    targets: { individuals: 0, entities: 0 },
    keyMeasures: [
      "Export ban on advanced semiconductors and microelectronics to Russia",
      "Restrictions on quantum computing, telecom, and navigation equipment",
      "Foreign Direct Product Rule applied to Russia (extraterritorial reach)",
      "Entity List designations for Russian military end-users",
    ],
    source: "https://www.bis.doc.gov/index.php/documents/about-bis/newsroom/press-releases/",
  },
  {
    id: "us-dec2023",
    date: "20231222",
    imposedBy: "US",
    packageName: "US EO 14114 — Secondary Sanctions on Foreign Banks",
    description:
      "Authorised secondary sanctions on foreign financial institutions " +
      "facilitating transactions for Russia's military-industrial complex.",
    targets: { individuals: 0, entities: 0 },
    keyMeasures: [
      "Secondary sanctions risk for foreign banks dealing with Russia's MIC",
      "Broadened definition of sanctionable Russian military-industrial entities",
      "Empowered OFAC to cut off foreign bank USD access for non-compliance",
    ],
    source: "https://home.treasury.gov/news/press-releases/jy2011",
  },

  // ── UK Sanctions ──────────────────────────────────────────────────────────
  {
    id: "uk-feb2022",
    date: "20220224",
    imposedBy: "UK",
    packageName: "UK Initial Sanctions — Invasion Response",
    description:
      "Immediate asset freezes and travel bans on major Russian banks, " +
      "oligarchs, and senior officials.",
    targets: { individuals: 100, entities: 18 },
    keyMeasures: [
      "Asset freezes on all major Russian banks including VTB",
      "Travel bans on over 100 individuals including oligarchs",
      "Ban on Russian companies issuing securities in the UK",
      "Restrictions on high-tech exports to Russia",
    ],
    source: "https://www.gov.uk/government/collections/uk-sanctions-on-russia",
  },
  {
    id: "uk-oligarchs-mar2022",
    date: "20220310",
    imposedBy: "UK",
    packageName: "UK Oligarch Asset Freeze Expansion",
    description:
      "Major expansion targeting prominent Russian oligarchs with UK assets " +
      "including Abramovich, Deripaska, and Sechin.",
    targets: { individuals: 7, entities: 0 },
    keyMeasures: [
      "Asset freeze on Roman Abramovich (forced Chelsea FC sale)",
      "Sanctions on Oleg Deripaska, Igor Sechin, and others",
      "Freeze on luxury London property held by sanctioned individuals",
    ],
    source: "https://www.gov.uk/government/news/oligarch-sanctions-march-2022",
  },
  {
    id: "uk-trade-2022",
    date: "20220415",
    imposedBy: "UK",
    packageName: "UK Trade Sanctions & Import Bans",
    description:
      "Comprehensive trade restrictions including bans on Russian oil, " +
      "gold, iron, and steel imports.",
    targets: { individuals: 0, entities: 0 },
    keyMeasures: [
      "Phased ban on Russian oil and oil product imports (by end of 2022)",
      "Import ban on Russian gold, iron, steel, and wood products",
      "Export ban on luxury goods, oil refining equipment, and advanced tech",
      "Ban on UK accountancy, PR, and management consulting services to Russia",
    ],
    source: "https://www.gov.uk/government/collections/uk-sanctions-on-russia",
  },

  // ── Canada ────────────────────────────────────────────────────────────────
  {
    id: "ca-feb2022",
    date: "20220224",
    imposedBy: "Canada",
    packageName: "Canada Special Economic Measures — Russia & Belarus",
    description:
      "Immediate economic sanctions on Russian and Belarusian officials, " +
      "banks, and oligarchs in response to the invasion.",
    targets: { individuals: 500, entities: 160 },
    keyMeasures: [
      "Sanctions on over 500 individuals including Putin and Lukashenko",
      "Ban on imports of Russian crude oil, refined petroleum, and gold",
      "Prohibition on export of advanced technology to Russia",
      "Seizure and forfeiture framework for sanctioned assets",
    ],
    source:
      "https://www.international.gc.ca/world-monde/international_relations-relations_internationales/sanctions/russia-russie.aspx",
  },

  // ── Japan ─────────────────────────────────────────────────────────────────
  {
    id: "jp-mar2022",
    date: "20220301",
    imposedBy: "Japan",
    packageName: "Japan Sanctions & Export Controls — Russia",
    description:
      "Japan aligned with G7 sanctions including Central Bank asset freeze, " +
      "SWIFT disconnection support, and semiconductor export controls.",
    targets: { individuals: 78, entities: 12 },
    keyMeasures: [
      "Freeze of Russian Central Bank assets held in Japan",
      "Asset freezes on Russian oligarchs and military officials",
      "Export ban on semiconductors and advanced technology to Russia",
      "Ban on imports of Russian gold and select goods",
    ],
    source: "https://www.mofa.go.jp/press/release/press1e_000344.html",
  },

  // ── Australia ─────────────────────────────────────────────────────────────
  {
    id: "au-feb2022",
    date: "20220225",
    imposedBy: "Australia",
    packageName: "Australia Autonomous Sanctions — Russia",
    description:
      "Travel bans, asset freezes, and trade restrictions aligned with " +
      "G7 and EU sanctions on Russia.",
    targets: { individuals: 843, entities: 69 },
    keyMeasures: [
      "Targeted financial sanctions on over 800 Russian and Belarusian individuals",
      "Ban on export of alumina and aluminium ores to Russia",
      "Import ban on Russian gold, oil, and refined petroleum",
      "Ban on luxury goods exports to Russia",
    ],
    source:
      "https://www.dfat.gov.au/international-relations/security/sanctions/sanctions-regimes/russia",
  },

  // ── Switzerland ───────────────────────────────────────────────────────────
  {
    id: "ch-feb2022",
    date: "20220228",
    imposedBy: "Switzerland",
    packageName: "Switzerland Sanctions Adoption — Russia",
    description:
      "Historic break with Swiss neutrality tradition. Adopted EU sanctions " +
      "including asset freezes on Russian officials and oligarchs.",
    targets: { individuals: 1000, entities: 90 },
    keyMeasures: [
      "Adopted EU sanctions in full — unprecedented departure from neutrality",
      "Froze Russian assets held in Swiss banks (~CHF 7.5B identified)",
      "Closed Swiss airspace to Russian aircraft",
      "Banned transactions with the Russian Central Bank",
    ],
    source: "https://www.admin.ch/gov/en/start/documentation/media-releases.msg-id-87386.html",
  },
];

/**
 * Computed summary of all sanctions packages.
 */
export const SANCTIONS_SUMMARY: SanctionsSummary = (() => {
  const byImposer: Record<string, number> = {};
  let totalIndividuals = 0;
  let totalEntities = 0;

  for (const pkg of SANCTIONS_PACKAGES) {
    byImposer[pkg.imposedBy] = (byImposer[pkg.imposedBy] ?? 0) + 1;
    totalIndividuals += pkg.targets.individuals;
    totalEntities += pkg.targets.entities;
  }

  return {
    totalPackages: SANCTIONS_PACKAGES.length,
    totalIndividualsSanctioned: totalIndividuals,
    totalEntitiesSanctioned: totalEntities,
    byImposer,
    keyBans: [
      "SWIFT disconnection of major Russian banks (Feb 2022)",
      "Russian Central Bank asset freeze (~€300B, Feb 2022)",
      "EU oil embargo covering ~90% of Russian crude imports (Jun 2022)",
      "G7 Russian oil price cap at $60/barrel (Dec 2022)",
      "Coal import ban (EU Aug 2022, others aligned)",
      "Gold import ban (G7 Jul 2022)",
      "Diamond import ban (EU Jan 2024)",
      "Sweeping semiconductor and advanced technology export controls",
      "Russian LNG re-export ban via EU territory (Jun 2024)",
      "Secondary sanctions on foreign banks aiding Russia's military-industrial complex",
    ],
  };
})();

/**
 * Returns all sanctions packages imposed on or before the given date.
 * @param dateYYYYMMDD - Date string in YYYYMMDD format.
 */
export function getSanctionsByDate(dateYYYYMMDD: string): SanctionsPackage[] {
  return SANCTIONS_PACKAGES.filter((pkg) => pkg.date <= dateYYYYMMDD);
}
