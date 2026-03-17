export interface WarEvent {
  date: string;
  label: string;
  description: string;
}

export const KEY_EVENTS: WarEvent[] = [
  // 2022
  { date: "20220224", label: "Invasion begins", description: "Russia launches full-scale invasion of Ukraine from multiple directions" },
  { date: "20220227", label: "Sanctions & SWIFT", description: "Western nations impose sweeping sanctions; select Russian banks cut from SWIFT" },
  { date: "20220302", label: "Kherson falls", description: "Russia captures Kherson, the first major Ukrainian city to fall" },
  { date: "20220316", label: "Mariupol siege", description: "Russian forces encircle Mariupol; intense urban combat begins" },
  { date: "20220402", label: "Bucha massacre", description: "Ukrainian forces recapture Bucha; evidence of mass civilian killings discovered" },
  { date: "20220414", label: "Moskva sinks", description: "Ukrainian Neptune missiles sink the Russian Black Sea flagship Moskva" },
  { date: "20220520", label: "Azovstal surrender", description: "Last Ukrainian defenders of Mariupol's Azovstal steel plant surrender" },
  { date: "20220624", label: "Lysychansk falls", description: "Russia captures Lysychansk, completing control of Luhansk Oblast" },
  { date: "20220906", label: "Kharkiv offensive", description: "Ukraine launches rapid counteroffensive, liberating most of Kharkiv Oblast in days" },
  { date: "20221008", label: "Crimea Bridge hit", description: "Explosion damages the Kerch Strait Bridge connecting Crimea to Russia" },
  { date: "20221111", label: "Kherson liberated", description: "Russia withdraws from Kherson; Ukraine's most significant territorial gain" },
  // 2023
  { date: "20230121", label: "Tanks pledged", description: "Western allies pledge Leopard 2 and M1 Abrams tanks to Ukraine" },
  { date: "20230521", label: "Bakhmut falls", description: "Wagner forces capture Bakhmut after the war's longest and bloodiest battle" },
  { date: "20230608", label: "Kakhovka Dam", description: "Kakhovka Dam is destroyed, causing catastrophic flooding downstream" },
  { date: "20230610", label: "Summer offensive", description: "Ukraine begins long-anticipated counteroffensive in southern Zaporizhzhia" },
  { date: "20230823", label: "Prigozhin killed", description: "Wagner leader Yevgeny Prigozhin dies in plane crash two months after aborted mutiny" },
  // 2024
  { date: "20240217", label: "Avdiivka falls", description: "Russia captures Avdiivka after months of intense fighting" },
  { date: "20240708", label: "DeepState tracking", description: "DeepState high-resolution polygon territory data begins (VIINA point-data covers earlier)" },
  { date: "20240718", label: "Pokrovsk offensive", description: "Russia launches major offensive toward Pokrovsk in Donetsk Oblast with ~40,000 troops" },
  { date: "20240806", label: "Kursk offensive", description: "Ukraine launches surprise cross-border offensive into Russia's Kursk Oblast" },
  { date: "20240826", label: "Massive energy strikes", description: "Russia launches one of its largest combined missile and drone attacks targeting Ukrainian energy infrastructure" },
  { date: "20240901", label: "Novohrodivka falls", description: "Russian forces capture Novohrodivka in their advance toward Pokrovsk" },
  { date: "20241005", label: "Vuhledar falls", description: "Russia captures Vuhledar after prolonged siege" },
  { date: "20241016", label: "Kurakhove battle begins", description: "Russian forces begin assault on the city of Kurakhove in Donetsk Oblast" },
  { date: "20241105", label: "US election", description: "Donald Trump wins US presidential election, casting uncertainty over Ukraine support" },
  { date: "20241115", label: "Selydove falls", description: "Russian forces capture the city of Selydove in Donetsk Oblast" },
  { date: "20241216", label: "DPRK troops deployed", description: "North Korean soldiers confirmed fighting alongside Russian forces in Kursk" },
  { date: "20241225", label: "Kurakhove falls", description: "Russia captures Kurakhove after 2-month battle, seizes power station" },
  // 2025
  { date: "20250120", label: "Trump inaugurated", description: "Trump takes office, signals prioritization of ending the war" },
  { date: "20250224", label: "3rd anniversary", description: "Three years since Russia's full-scale invasion of Ukraine" },
  { date: "20250318", label: "Ceasefire proposed", description: "Trump-Putin call results in proposed limited ceasefire on energy infrastructure; quickly broken" },
  { date: "20250426", label: "Kursk recaptured", description: "Russia claims all Ukrainian forces driven out of Kursk region" },
  { date: "20250601", label: "Operation Spider Web", description: "Ukraine launches coordinated long-range drone strikes on Russian airfields deep in Russian territory" },
  { date: "20250630", label: "Luhansk fully occupied", description: "Russia claims complete control of Luhansk Oblast" },
  { date: "20250731", label: "Chasiv Yar falls", description: "Russia captures the strategic fortress city of Chasiv Yar after prolonged assault" },
  { date: "20250815", label: "Alaska summit", description: "Trump and Putin meet at Joint Base Elmendorf-Richardson in Anchorage; no ceasefire achieved" },
  { date: "20250818", label: "DC summit", description: "Trump hosts Zelenskyy and European/NATO leaders at White House; cautious optimism, no breakthrough" },
];
