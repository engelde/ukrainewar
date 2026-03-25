export type SupportSide = "ukraine" | "russia";
export type SupportType =
  | "military"
  | "financial"
  | "humanitarian"
  | "political"
  | "sanctions"
  | "troops";

export interface CountrySupport {
  country: string;
  countryCode: string;
  side: SupportSide;
  supportTypes: SupportType[];
  totalAidBillionUSD?: number;
  description: string;
  notable?: string;
}

/**
 * International support for Ukraine and Russia in the Russo-Ukrainian War.
 * Aid figures are estimates based on publicly available Kiel Institute
 * (Ukraine Support Tracker) and government data through late 2024.
 * Sorted by totalAidBillionUSD descending within each side, then
 * alphabetically for entries without amounts.
 */
export const INTERNATIONAL_SUPPORT: CountrySupport[] = [
  // ── Ukraine supporters (by total aid, descending) ──────────────────

  {
    country: "European Union",
    countryCode: "EU",
    side: "ukraine",
    supportTypes: ["military", "financial", "humanitarian", "political", "sanctions"],
    totalAidBillionUSD: 115.0,
    description:
      "The EU collectively committed over €100 billion in military, financial, " +
      "and humanitarian support, including macro-financial assistance loans, " +
      "ammunition procurement via the European Peace Facility, and 14 packages " +
      "of sanctions against Russia.",
    notable:
      "€50B macro-financial assistance package (2024), European Peace Facility " +
      "arms deliveries, training mission EUMAM Ukraine",
  },
  {
    country: "United States",
    countryCode: "US",
    side: "ukraine",
    supportTypes: ["military", "financial", "humanitarian", "political", "sanctions"],
    totalAidBillionUSD: 66.2,
    description:
      "The largest single-country donor, providing massive military aid " +
      "packages, direct budget support, and humanitarian assistance. The US " +
      "also led the coordination of Western sanctions against Russia.",
    notable:
      "HIMARS, Patriot air defense, M1 Abrams tanks, ATACMS missiles, " +
      "F-16 training pipeline, Bradley IFVs, cluster munitions",
  },
  {
    country: "Germany",
    countryCode: "DE",
    side: "ukraine",
    supportTypes: ["military", "financial", "humanitarian", "political", "sanctions"],
    totalAidBillionUSD: 21.8,
    description:
      "Germany reversed decades of defense export policy with its " +
      "Zeitenwende and became Europe's largest bilateral donor, delivering " +
      "heavy weapons and extensive financial support.",
    notable:
      "IRIS-T SLM air defense, Leopard 2 tanks, Gepard SPAAG, Marder IFVs, " +
      "MARS II MLRS, Patriot system",
  },
  {
    country: "United Kingdom",
    countryCode: "GB",
    side: "ukraine",
    supportTypes: ["military", "financial", "humanitarian", "political", "sanctions"],
    totalAidBillionUSD: 19.5,
    description:
      "An early and vocal supporter, the UK was among the first to supply " +
      "lethal aid before the full-scale invasion and has maintained a leading " +
      "role in military assistance and sanctions enforcement.",
    notable:
      "Storm Shadow cruise missiles, Challenger 2 tanks, NLAW anti-tank " +
      "missiles, AS-90 artillery, major training programs (Operation Interflex)",
  },
  {
    country: "Denmark",
    countryCode: "DK",
    side: "ukraine",
    supportTypes: ["military", "financial", "humanitarian", "political", "sanctions"],
    totalAidBillionUSD: 8.4,
    description:
      "Denmark has been one of the most generous donors relative to GDP, " +
      "donating its entire artillery inventory and committing substantial " +
      "long-term financial support.",
    notable:
      "Donated entire Caesar howitzer order, F-16 fighter jets, Harpoon " + "anti-ship missiles",
  },
  {
    country: "Norway",
    countryCode: "NO",
    side: "ukraine",
    supportTypes: ["military", "financial", "humanitarian", "political", "sanctions"],
    totalAidBillionUSD: 7.8,
    description:
      "Norway pledged a multi-year Nansen Support Programme and donated " +
      "significant military equipment from its own stockpiles.",
    notable: "NASAMS air defense systems, M109 howitzers, multi-year $7.5B Nansen " + "programme",
  },
  {
    country: "Netherlands",
    countryCode: "NL",
    side: "ukraine",
    supportTypes: ["military", "financial", "humanitarian", "political", "sanctions"],
    totalAidBillionUSD: 6.4,
    description:
      "The Netherlands has provided extensive military equipment and led " +
      "the coalition to supply F-16 fighter jets to Ukraine.",
    notable:
      "F-16 fighter jets (co-lead of F-16 coalition), PzH 2000 howitzers, " +
      "Patriot air defense components",
  },
  {
    country: "Sweden",
    countryCode: "SE",
    side: "ukraine",
    supportTypes: ["military", "financial", "humanitarian", "political", "sanctions"],
    totalAidBillionUSD: 5.2,
    description:
      "Sweden delivered substantial military aid including advanced weapons " +
      "systems and joined NATO partly in response to the Russian invasion.",
    notable:
      "CV90 IFVs, Archer self-propelled howitzers, RBS 70 air defense, " +
      "Gripen training discussions",
  },
  {
    country: "Canada",
    countryCode: "CA",
    side: "ukraine",
    supportTypes: ["military", "financial", "humanitarian", "political", "sanctions"],
    totalAidBillionUSD: 4.5,
    description:
      "Canada has been a consistent supporter, providing military hardware, " +
      "financial assistance, and hosting a large Ukrainian diaspora " +
      "community that advocates for continued aid.",
    notable:
      "Leopard 2 tanks, M777 howitzers, Senator APCs, NASAMS components, " +
      "Operation Unifier training mission",
  },
  {
    country: "Poland",
    countryCode: "PL",
    side: "ukraine",
    supportTypes: ["military", "financial", "humanitarian", "political", "sanctions"],
    totalAidBillionUSD: 4.3,
    description:
      "Poland has been a critical logistics hub and one of the earliest " +
      "donors of heavy equipment, transferring Soviet-era and modern systems " +
      "and hosting millions of Ukrainian refugees.",
    notable:
      "MiG-29 fighter jets, PT-91 Twardy tanks, Krab howitzers, Piorun " +
      "MANPADS, hosted ~1.5M refugees",
  },
  {
    country: "France",
    countryCode: "FR",
    side: "ukraine",
    supportTypes: ["military", "financial", "humanitarian", "political", "sanctions"],
    totalAidBillionUSD: 3.8,
    description:
      "France has provided advanced military systems and financial support " +
      "while maintaining diplomatic engagement. Aid accelerated " +
      "significantly from 2023 onward.",
    notable:
      "SCALP cruise missiles, Caesar howitzers, AMX-10 RC armored vehicles, " +
      "Crotale air defense",
  },
  {
    country: "Finland",
    countryCode: "FI",
    side: "ukraine",
    supportTypes: ["military", "financial", "humanitarian", "political", "sanctions"],
    totalAidBillionUSD: 2.3,
    description:
      "Finland joined NATO in 2023 largely due to Russia's invasion and has " +
      "provided extensive military support relative to its size, drawing " +
      "from substantial defense stockpiles.",
    notable:
      "Leopard 2 spare parts, heavy artillery, anti-tank mines, " +
      "demining equipment, 26 military aid packages",
  },
  {
    country: "Japan",
    countryCode: "JP",
    side: "ukraine",
    supportTypes: ["financial", "humanitarian", "political", "sanctions"],
    totalAidBillionUSD: 2.2,
    description:
      "Japan broke with its pacifist norms to impose strict sanctions on " +
      "Russia and provided substantial financial and humanitarian aid, though " +
      "constitutional constraints prevent lethal military exports.",
    notable:
      "Non-lethal defense equipment (helmets, generators), humanitarian " +
      "demining, G7 sanctions coordination",
  },
  {
    country: "Italy",
    countryCode: "IT",
    side: "ukraine",
    supportTypes: ["military", "financial", "humanitarian", "political", "sanctions"],
    totalAidBillionUSD: 2.1,
    description:
      "Italy has delivered multiple military aid packages and financial " +
      "assistance while participating in EU-wide sanctions against Russia.",
    notable:
      "SAMP/T Mamba air defense system, FH70 howitzers, M109 SPGs, " + "Lince armored vehicles",
  },
  {
    country: "Czech Republic",
    countryCode: "CZ",
    side: "ukraine",
    supportTypes: ["military", "financial", "humanitarian", "political", "sanctions"],
    totalAidBillionUSD: 1.8,
    description:
      "The Czech Republic has been an outsized contributor relative to its " +
      "GDP, leading the effort to source Soviet-era ammunition from global " +
      "stockpiles for Ukraine.",
    notable:
      "Czech ammunition initiative (800k+ shells), T-72 tanks, " + "Dana howitzers, RM-70 MLRS",
  },
  {
    country: "Estonia",
    countryCode: "EE",
    side: "ukraine",
    supportTypes: ["military", "financial", "humanitarian", "political", "sanctions"],
    totalAidBillionUSD: 1.3,
    description:
      "Estonia is the top per-capita and per-GDP donor to Ukraine, " +
      "donating a remarkable share of its defense inventory despite " +
      "its own proximity to Russia.",
    notable:
      "Javelin anti-tank missiles, FH70 howitzers, anti-tank mines, " +
      "1.3% of GDP committed to Ukraine aid",
  },
  {
    country: "Latvia",
    countryCode: "LV",
    side: "ukraine",
    supportTypes: ["military", "financial", "humanitarian", "political", "sanctions"],
    totalAidBillionUSD: 0.7,
    description:
      "Latvia has donated a disproportionately large share of its " +
      "military stocks relative to its economy and population, " +
      "ranking among the highest per-GDP donors.",
    notable:
      "Stinger MANPADS, M109 howitzers, field hospital equipment, " + "drones and ammunition",
  },
  {
    country: "Lithuania",
    countryCode: "LT",
    side: "ukraine",
    supportTypes: ["military", "financial", "humanitarian", "political", "sanctions"],
    totalAidBillionUSD: 0.7,
    description:
      "Lithuania has been among the most committed Baltic donors, " +
      "providing military and humanitarian aid while advocating for " +
      "maximum Western support.",
    notable:
      "M577 APCs, Stinger MANPADS, L-70 anti-aircraft guns, " + "crowdfunded Bayraktar TB2 drone",
  },
  {
    country: "Belgium",
    countryCode: "BE",
    side: "ukraine",
    supportTypes: ["military", "financial", "humanitarian", "political", "sanctions"],
    totalAidBillionUSD: 0.6,
    description:
      "Belgium has contributed military equipment and financial " +
      "assistance and pledged F-16 aircraft as part of the broader " +
      "coalition effort.",
    notable: "F-16 fighter jets pledged, FN Minimi machine guns, demining aid",
  },
  {
    country: "Spain",
    countryCode: "ES",
    side: "ukraine",
    supportTypes: ["military", "financial", "humanitarian", "political", "sanctions"],
    totalAidBillionUSD: 0.5,
    description:
      "Spain has provided military equipment and humanitarian aid " +
      "while participating in EU sanctions and NATO support measures.",
    notable: "Leopard 2A4 tanks, HA-200 Saeta aircraft for training, " + "ammunition, body armor",
  },
  {
    country: "Australia",
    countryCode: "AU",
    side: "ukraine",
    supportTypes: ["military", "financial", "humanitarian", "political", "sanctions"],
    totalAidBillionUSD: 0.5,
    description:
      "Australia has been the largest non-NATO donor of military aid, " +
      "providing armored vehicles, munitions, and financial support " +
      "despite its geographic distance.",
    notable: "Bushmaster PMVs, M113 APCs, ammunition, humanitarian " + "demining support",
  },
  {
    country: "Slovakia",
    countryCode: "SK",
    side: "ukraine",
    supportTypes: ["military", "financial", "humanitarian", "political", "sanctions"],
    totalAidBillionUSD: 0.5,
    description:
      "Slovakia made a landmark donation of its S-300 air defense " +
      "system early in the conflict, though political changes in 2023 " +
      "slowed further military commitments.",
    notable: "S-300 air defense system, MiG-29 fighter jets, Zuzana 2 " + "howitzers, BMP-1 IFVs",
  },
  {
    country: "Romania",
    countryCode: "RO",
    side: "ukraine",
    supportTypes: ["military", "financial", "humanitarian", "political", "sanctions"],
    totalAidBillionUSD: 0.3,
    description:
      "Romania has facilitated Ukrainian grain exports via the Danube " +
      "corridor and contributed military and humanitarian assistance.",
    notable: "Patriot air defense pledge, grain transit via Danube ports, " + "ammunition supplies",
  },
  {
    country: "Portugal",
    countryCode: "PT",
    side: "ukraine",
    supportTypes: ["military", "financial", "humanitarian", "political", "sanctions"],
    totalAidBillionUSD: 0.25,
    description:
      "Portugal has contributed military equipment and participated " +
      "in EU and NATO support measures for Ukraine.",
    notable: "M113 APCs, Leopard 2 tanks, howitzers, ammunition",
  },
  {
    country: "Croatia",
    countryCode: "HR",
    side: "ukraine",
    supportTypes: ["military", "humanitarian", "political", "sanctions"],
    totalAidBillionUSD: 0.2,
    description:
      "Drawing on its own experience from the 1990s wars, Croatia " +
      "donated Soviet-era military equipment and provided humanitarian " +
      "support.",
    notable:
      "Mi-8 helicopters, M-46 howitzers, small arms, demining " +
      "expertise from own post-war experience",
  },
  {
    country: "South Korea",
    countryCode: "KR",
    side: "ukraine",
    supportTypes: ["financial", "humanitarian", "political", "sanctions"],
    totalAidBillionUSD: 0.15,
    description:
      "South Korea has provided non-lethal military supplies and " +
      "humanitarian aid while maintaining a policy against supplying " +
      "lethal weapons to active conflict zones.",
    notable:
      "Non-lethal equipment (helmets, medical supplies), humanitarian " +
      "aid, strict sanctions on Russia",
  },
  {
    country: "Bulgaria",
    countryCode: "BG",
    side: "ukraine",
    supportTypes: ["military", "humanitarian", "political", "sanctions"],
    totalAidBillionUSD: 0.1,
    description:
      "Bulgaria transferred Soviet-era ammunition and equipment, " +
      "though domestic politics complicated the pace of deliveries.",
    notable: "Soviet-caliber ammunition, RPGs, diesel fuel supplies",
  },
  {
    country: "Greece",
    countryCode: "GR",
    side: "ukraine",
    supportTypes: ["military", "humanitarian", "political", "sanctions"],
    totalAidBillionUSD: 0.1,
    description:
      "Greece donated Soviet-era equipment and participated in EU " +
      "sanctions while balancing historically close cultural ties with " +
      "Russia.",
    notable: "BMP-1 IFVs, Kalashnikov-pattern rifles, ammunition, body armor",
  },
  {
    country: "Ireland",
    countryCode: "IE",
    side: "ukraine",
    supportTypes: ["financial", "humanitarian", "political", "sanctions"],
    totalAidBillionUSD: 0.1,
    description:
      "As a militarily neutral state, Ireland has focused on " +
      "humanitarian and financial support, as well as hosting " +
      "Ukrainian refugees under temporary protection.",
    notable:
      "Humanitarian aid, refugee hosting (~100k), body armor " + "(non-lethal), fuel supplies",
  },
  {
    country: "New Zealand",
    countryCode: "NZ",
    side: "ukraine",
    supportTypes: ["financial", "humanitarian", "political", "sanctions"],
    totalAidBillionUSD: 0.05,
    description:
      "New Zealand contributed financial and humanitarian assistance " +
      "and imposed sanctions on Russia despite its geographic distance " +
      "from the conflict.",
    notable: "Intelligence personnel deployments to UK, humanitarian contributions",
  },
  {
    country: "Switzerland",
    countryCode: "CH",
    side: "ukraine",
    supportTypes: ["financial", "humanitarian", "political"],
    totalAidBillionUSD: 0.05,
    description:
      "Switzerland broke with its traditional neutrality by adopting " +
      "EU sanctions against Russia and providing humanitarian aid, " +
      "though it declined to allow re-export of Swiss-made weapons.",
    notable:
      "Adopted EU sanctions (historic break from neutrality), " +
      "humanitarian demining, Bürgenstock peace summit (2024)",
  },

  // ── Russia supporters ─────────────────────────────────────────────

  {
    country: "Belarus",
    countryCode: "BY",
    side: "russia",
    supportTypes: ["military", "political", "troops"],
    description:
      "Belarus allowed Russia to stage its northern invasion from " +
      "Belarusian territory and continues to host Russian forces, " +
      "serving as a persistent threat axis toward Kyiv.",
    notable:
      "Staging ground for initial invasion, joint military exercises, " +
      "Russian tactical nuclear weapons deployed on Belarusian soil",
  },
  {
    country: "North Korea",
    countryCode: "KP",
    side: "russia",
    supportTypes: ["military", "troops"],
    description:
      "North Korea has provided large quantities of ammunition and " +
      "ballistic missiles and deployed an estimated 10,000–12,000 " +
      "troops to fight alongside Russian forces in Kursk Oblast.",
    notable:
      "KN-23 / KN-24 ballistic missiles, millions of artillery shells, " +
      "~10,000–12,000 troops deployed to Kursk (2024)",
  },
  {
    country: "Iran",
    countryCode: "IR",
    side: "russia",
    supportTypes: ["military"],
    description:
      "Iran supplied hundreds of Shahed-series kamikaze drones that " +
      "Russia uses extensively against Ukrainian energy infrastructure " +
      "and cities, as well as short-range ballistic missiles.",
    notable:
      "Shahed-136/131 one-way attack drones (rebranded Geran-2), " +
      "Fath-360 ballistic missiles, drone production technology transfer",
  },
  {
    country: "China",
    countryCode: "CN",
    side: "russia",
    supportTypes: ["political", "financial"],
    description:
      "China has not provided direct lethal military aid but serves as " +
      "Russia's most important economic lifeline, purchasing Russian oil " +
      "and gas at discounted prices and supplying dual-use goods that " +
      "sustain Russia's defense industry.",
    notable:
      "Major buyer of discounted Russian energy, dual-use electronics " +
      "and machine tools, diplomatic shielding at the UN Security Council",
  },
  {
    country: "Syria",
    countryCode: "SY",
    side: "russia",
    supportTypes: ["political"],
    description:
      "The Assad government recognized the independence of the Russian-" +
      "backed Donetsk and Luhansk separatist entities and consistently " +
      "supported Russia in UN votes.",
    notable:
      "Recognized DPR/LPR independence, recruited Syrian fighters " +
      "offered for Russian service (limited numbers)",
  },
  {
    country: "Eritrea",
    countryCode: "ER",
    side: "russia",
    supportTypes: ["political"],
    description:
      "Eritrea was one of only a handful of states to vote against UN " +
      "General Assembly resolutions condemning the Russian invasion " +
      "of Ukraine.",
    notable: "Voted against UNGA Resolution ES-11/1 condemning the invasion",
  },
  {
    country: "Nicaragua",
    countryCode: "NI",
    side: "russia",
    supportTypes: ["political"],
    description:
      "Nicaragua has consistently voted in support of Russia at the " +
      "United Nations and expressed public solidarity with Moscow.",
    notable: "Voted against UNGA resolutions condemning the invasion",
  },
  {
    country: "Mali",
    countryCode: "ML",
    side: "russia",
    supportTypes: ["political"],
    description:
      "Mali's military junta deepened ties with Russia and the Wagner " +
      "Group, providing political support in international forums.",
    notable: "Wagner Group / Africa Corps military cooperation, UN voting alignment",
  },
  {
    country: "Myanmar",
    countryCode: "MM",
    side: "russia",
    supportTypes: ["political"],
    description:
      "Myanmar's military government has expressed support for Russia " +
      "and maintained defense cooperation, voting in favor of Russia " +
      "at the UN.",
    notable: "Military junta diplomatic alignment, arms procurement from Russia",
  },
  {
    country: "Cuba",
    countryCode: "CU",
    side: "russia",
    supportTypes: ["political"],
    description:
      "Cuba has maintained its longstanding alignment with Moscow, " +
      "blaming NATO expansion for the conflict and voting against UN " +
      "resolutions condemning the invasion.",
    notable: "Voted against UNGA condemnation resolutions, diplomatic solidarity",
  },
];

// ── Summary statistics ──────────────────────────────────────────────

const ukraineSupporters = INTERNATIONAL_SUPPORT.filter((c) => c.side === "ukraine");
const russiaSupporters = INTERNATIONAL_SUPPORT.filter((c) => c.side === "russia");

const totalUkraineAid = ukraineSupporters.reduce((sum, c) => sum + (c.totalAidBillionUSD ?? 0), 0);

const topContributors = ukraineSupporters
  .filter((c) => c.totalAidBillionUSD != null)
  .sort((a, b) => (b.totalAidBillionUSD ?? 0) - (a.totalAidBillionUSD ?? 0))
  .slice(0, 5)
  .map((c) => c.country);

export const SUPPORT_STATS = {
  ukraineSupporters: ukraineSupporters.length,
  russiaSupporters: russiaSupporters.length,
  totalUkraineAidBillionUSD: Math.round(totalUkraineAid * 100) / 100,
  topContributors,
};
