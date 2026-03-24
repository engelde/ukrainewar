import type { WarEvent } from "./events";

/**
 * Curated seed events that no external API covers.
 * These are political, diplomatic, and editorial events
 * that are important to the war's timeline but don't appear
 * in conflict databases like ACLED or Wikidata.
 *
 * Wikidata SPARQL covers military events (battles, sieges, strikes).
 * ACLED covers granular daily conflict events.
 * This file fills the gap for political/diplomatic milestones.
 */
export const SEED_EVENTS: WarEvent[] = [
  // ──── 2021 — Pre-invasion buildup ─────────────────────────────────────

  {
    date: "20210303",
    label: "Russia begins military buildup near Ukraine",
    description:
      "Russia deploys thousands of troops and heavy equipment to Crimea, Rostov, Bryansk, and Voronezh oblasts — the largest mobilization since the 2014 annexation of Crimea",
    lat: 51.07,
    lng: 39.18,
    highlight: true,
  },
  {
    date: "20210326",
    label: "Russian mortar attack kills 4 Ukrainian soldiers",
    description:
      "Russian troops fire mortars at Ukrainian positions near the village of Shumy in Donbas, killing four servicemen and escalating tensions",
    lat: 48.55,
    lng: 37.8,
  },
  {
    date: "20210401",
    label: "Russia refuses Donbas ceasefire renewal",
    description:
      "Russia refuses to renew the ceasefire in Donbas; satellite imagery confirms 28 battalion tactical groups staged near the Ukrainian border",
  },
  {
    date: "20210422",
    label: "Partial troop withdrawal announced",
    description:
      "Russia announces partial withdrawal of forces from the border, but equipment and infrastructure remain in place, allowing rapid redeployment",
  },
  {
    date: "20210712",
    label: "Putin publishes essay on Russian-Ukrainian unity",
    description:
      "Putin publishes 'On the Historical Unity of Russians and Ukrainians,' asserting that Russians and Ukrainians are 'one people' — the essay is made compulsory reading for Russian soldiers",
  },
  {
    date: "20210910",
    label: "Zapad 2021 military exercise begins",
    description:
      "Russia and Belarus launch Zapad 2021 — a joint strategic exercise involving 200,000 troops, 760 armored vehicles, 290 tanks, 80+ aircraft, and 15 ships across 14 training grounds",
    lat: 56.12,
    lng: 43.2,
    highlight: true,
  },
  {
    date: "20210915",
    label: "Zapad 2021 concludes",
    description:
      "Zapad 2021 exercises end; US intelligence later assesses them as rehearsal for the Ukraine invasion due to their unprecedented scale and composition",
    lat: 56.12,
    lng: 43.2,
  },
  {
    date: "20211026",
    label: "Renewed Russian military buildup begins",
    description:
      "Russia begins a second, larger military buildup near Ukraine, this time with deployments on new fronts including Belarus from the north",
    highlight: true,
  },
  {
    date: "20211203",
    label: "100,000 Russian troops reported near Ukraine",
    description:
      "Over 100,000 Russian troops are massed around Ukraine on three sides — from Russia, Belarus, and Crimea — according to US and European intelligence estimates",
  },
  {
    date: "20211207",
    label: "Biden warns Putin against invasion",
    description:
      "US President Biden holds a video call with Putin warning of severe economic sanctions and diplomatic consequences if Russia invades Ukraine",
  },
  {
    date: "20211217",
    label: "Russia issues security demands to NATO",
    description:
      "Russia presents draft treaties demanding NATO halt eastward expansion, withdraw forces from Eastern Europe, and guarantee Ukraine will never join the alliance",
  },
  {
    date: "20220110",
    label: "Russia-NATO talks fail to reach agreement",
    description:
      "Diplomatic talks between Russia and NATO in Geneva and Brussels fail; NATO rejects Russia's demands while offering dialogue on arms control",
  },
  {
    date: "20220117",
    label: "Russian forces deploy to Belarus for exercises",
    description:
      "Russia begins deploying troops to Belarus for 'Allied Resolve 2022' joint exercises, positioning forces north of Kyiv for the first time",
    lat: 52.05,
    lng: 29.25,
  },
  {
    date: "20220202",
    label: "US estimates 130,000 Russian troops at border",
    description:
      "The Pentagon reports approximately 130,000 Russian troops are positioned around Ukraine's borders with additional forces still arriving",
  },
  {
    date: "20220211",
    label: "US warns invasion could begin within days",
    description:
      "US National Security Advisor Jake Sullivan warns that Russia has assembled sufficient forces for a major military operation and invasion could begin at any time",
  },
  {
    date: "20220217",
    label: "175,000+ troops in final positions",
    description:
      "Western intelligence estimates 175,000–190,000 Russian troops in final invasion positions across 9 force groupings from Belarus to Crimea",
    highlight: true,
  },
  {
    date: "20220221",
    label: "Russia recognizes DPR and LPR",
    description:
      "Putin signs decrees recognizing the independence of the Donetsk and Luhansk People's Republics and orders Russian troops into the breakaway regions",
    lat: 48.02,
    lng: 37.8,
    highlight: true,
  },
  {
    date: "20220222",
    label: "Putin declares Minsk agreements invalid",
    description:
      "Putin declares the Minsk agreements no longer valid; the Federation Council unanimously authorizes him to use military force outside Russia",
  },

  // ──── 2022 ────────────────────────────────────────────────────────────

  {
    date: "20220224",
    label: "Full-scale invasion begins",
    description:
      "Russia launches a full-scale invasion of Ukraine with strikes across the country and ground offensives from multiple directions",
    lat: 50.45,
    lng: 30.52,
  },
  {
    date: "20220224",
    label: "Battle of Hostomel Airport",
    description:
      "Russian airborne troops attempt to seize Antonov Airport near Kyiv in a helicopter assault; Ukrainian forces contest the landing",
    lat: 50.594,
    lng: 30.228,
  },
  {
    date: "20220225",
    label: "Battle of Kyiv begins",
    description:
      "Russian armored columns advance toward Kyiv from the north and east, beginning a month-long battle for the capital",
    lat: 50.45,
    lng: 30.52,
  },
  {
    date: "20220226",
    label: "Bayraktar TB2 strikes",
    description:
      "Ukrainian Bayraktar TB2 drones destroy Russian convoy vehicles and logistics near Kyiv, becoming an early symbol of resistance",
  },
  {
    date: "20220227",
    label: "Sanctions & SWIFT",
    description: "Western nations impose sweeping sanctions; select Russian banks cut from SWIFT",
  },
  {
    date: "20220228",
    label: "Peace talks in Belarus",
    description:
      "First round of Russia-Ukraine peace negotiations held at Belarusian border; no breakthrough reached",
    lat: 52.085,
    lng: 23.657,
  },
  {
    date: "20220301",
    label: "Kharkiv cluster munitions",
    description:
      "Russian forces strike central Kharkiv with cluster munitions, hitting residential areas and the central square",
    lat: 49.993,
    lng: 36.231,
  },
  {
    date: "20220302",
    label: "Kherson falls",
    description: "Kherson becomes the first major Ukrainian city captured by Russian forces",
    lat: 46.636,
    lng: 32.617,
  },
  {
    date: "20220304",
    label: "Zaporizhzhia NPP seized",
    description:
      "Russian forces capture Europe's largest nuclear power plant after a firefight that causes international alarm",
    lat: 47.507,
    lng: 34.585,
  },
  {
    date: "20220309",
    label: "Mariupol maternity hospital bombed",
    description:
      "Russian airstrike destroys a maternity hospital in Mariupol, killing at least three and injuring dozens",
    lat: 47.097,
    lng: 37.533,
  },
  {
    date: "20220313",
    label: "Yavoriv base strike",
    description:
      "Russia strikes the International Peacekeeping and Security Centre near the Polish border with cruise missiles, killing at least 35",
    lat: 49.886,
    lng: 23.667,
  },
  {
    date: "20220316",
    label: "Mariupol theatre bombing",
    description:
      "Russian airstrike hits the Mariupol Drama Theatre where hundreds of civilians sheltered; the word 'children' was written outside. Estimated 300–600 killed",
    lat: 47.095,
    lng: 37.549,
  },
  {
    date: "20220316",
    label: "Zelenskyy addresses US Congress",
    description:
      "President Zelenskyy delivers virtual address to the US Congress, pleading for a no-fly zone and more military aid",
  },
  {
    date: "20220329",
    label: "Istanbul negotiations",
    description:
      "Russia-Ukraine negotiations in Istanbul show brief progress; Russia pledges to reduce operations near Kyiv and Chernihiv",
    lat: 41.015,
    lng: 28.98,
  },
  {
    date: "20220401",
    label: "Russia withdraws from Kyiv region",
    description:
      "Russian forces complete withdrawal from Kyiv, Chernihiv, and Sumy oblasts, marking the failure of the northern campaign",
    lat: 50.45,
    lng: 30.52,
  },
  {
    date: "20220402",
    label: "Bucha massacre discovered",
    description:
      "Ukrainian forces entering Bucha discover mass atrocities: hundreds of civilian bodies, evidence of executions, torture, and sexual violence",
    lat: 50.543,
    lng: 30.213,
  },
  {
    date: "20220408",
    label: "Kramatorsk station attack",
    description:
      "A Russian Tochka-U missile strikes Kramatorsk railway station where thousands of civilians were evacuating, killing at least 59",
    lat: 48.731,
    lng: 37.587,
  },
  {
    date: "20220413",
    label: "Moskva sunk",
    description:
      "Ukraine strikes the Russian Black Sea Fleet flagship Moskva with Neptune anti-ship missiles; the cruiser sinks the following day",
    lat: 45.33,
    lng: 31.0,
  },
  {
    date: "20220421",
    label: "Battle of Azovstal begins",
    description:
      "Russian forces besiege the Azovstal steel plant in Mariupol where the last Ukrainian defenders and hundreds of civilians hold out",
    lat: 47.096,
    lng: 37.639,
  },
  {
    date: "20220509",
    label: "Lend-Lease signed",
    description:
      "President Biden signs the Ukraine Democracy Defense Lend-Lease Act, streamlining military aid to Ukraine",
  },
  {
    date: "20220517",
    label: "Azovstal defenders surrender",
    description:
      "Remaining Ukrainian defenders at Azovstal surrender after 82 days of siege; over 2,400 fighters taken as POWs. Mariupol falls completely",
    lat: 47.096,
    lng: 37.639,
  },
  {
    date: "20220530",
    label: "Severodonetsk battle intensifies",
    description:
      "Russia concentrates forces on Severodonetsk in a grinding urban battle for the last Ukrainian-held city in Luhansk oblast",
    lat: 48.948,
    lng: 38.494,
  },
  {
    date: "20220601",
    label: "HIMARS arrive in Ukraine",
    description:
      "First US-supplied HIMARS rocket systems arrive in Ukraine, providing precision long-range strike capability that shifts the battlefield",
  },
  {
    date: "20220625",
    label: "Severodonetsk falls",
    description:
      "Ukrainian forces withdraw from Severodonetsk after weeks of intense urban combat; Russia controls most of Luhansk oblast",
    lat: 48.948,
    lng: 38.494,
  },
  {
    date: "20220703",
    label: "Lysychansk falls",
    description:
      "Russia captures Lysychansk, completing control of Luhansk oblast. Fighting shifts to Donetsk direction",
    lat: 48.904,
    lng: 38.441,
  },
  {
    date: "20220722",
    label: "Black Sea Grain Initiative",
    description:
      "UN-brokered grain deal signed in Istanbul allows Ukrainian grain exports through Black Sea corridors, easing global food crisis",
    lat: 41.015,
    lng: 28.98,
  },
  {
    date: "20220729",
    label: "Olenivka prison massacre",
    description:
      "Explosion at Olenivka prison in occupied Donetsk kills at least 53 Ukrainian POWs, mostly Azovstal defenders. Russia and Ukraine blame each other",
    lat: 47.849,
    lng: 37.645,
  },
  {
    date: "20220824",
    label: "Ukraine Independence Day",
    description:
      "Ukraine marks Independence Day under wartime conditions; Russia strikes Chaplyne railway station killing 25",
    lat: 48.717,
    lng: 35.738,
  },
  {
    date: "20220906",
    label: "Kharkiv counteroffensive begins",
    description:
      "Ukraine launches a surprise counteroffensive in Kharkiv oblast, rapidly liberating thousands of square kilometers in days",
    lat: 49.3,
    lng: 37.0,
  },
  {
    date: "20220911",
    label: "Izium liberated",
    description:
      "Ukrainian forces recapture Izium; mass burial site of over 440 bodies later discovered, many showing signs of torture",
    lat: 49.213,
    lng: 37.262,
  },
  {
    date: "20220921",
    label: "Russia announces mobilization",
    description:
      "Putin announces 'partial mobilization' of 300,000 reservists, triggering mass exodus of Russian men from the country",
  },
  {
    date: "20220926",
    label: "Nord Stream sabotage",
    description:
      "Explosions rupture the Nord Stream 1 and 2 gas pipelines under the Baltic Sea in an act of sabotage; perpetrator disputed",
    lat: 55.53,
    lng: 15.73,
  },
  {
    date: "20220930",
    label: "Annexation declared",
    description: "Russia illegally annexes Donetsk, Luhansk, Zaporizhzhia, and Kherson oblasts",
    lat: 55.751,
    lng: 37.618,
  },
  {
    date: "20221001",
    label: "Lyman liberated",
    description:
      "Ukrainian forces recapture the strategic rail junction of Lyman in Donetsk oblast, humiliating Russia days after annexation ceremony",
    lat: 48.984,
    lng: 37.802,
  },
  {
    date: "20221008",
    label: "Kerch Bridge explosion",
    description:
      "A massive explosion damages the Kerch Strait Bridge connecting Russia to Crimea, disrupting a key logistics route",
    lat: 45.314,
    lng: 36.505,
  },
  {
    date: "20221010",
    label: "Massive missile strikes on infrastructure",
    description:
      "Russia launches over 80 missiles at energy infrastructure across Ukraine in retaliation for the Kerch Bridge attack, causing widespread blackouts",
    lat: 50.45,
    lng: 30.52,
  },
  {
    date: "20221109",
    label: "Kherson withdrawal announced",
    description:
      "Russian Defense Minister Shoigu orders retreat from Kherson's west bank, the only regional capital Russia had captured",
    lat: 46.636,
    lng: 32.617,
  },
  {
    date: "20221111",
    label: "Kherson liberated",
    description:
      "Ukrainian forces enter Kherson city as Russian troops complete withdrawal across the Dnipro River. Residents celebrate in the streets",
    lat: 46.636,
    lng: 32.617,
  },
  {
    date: "20221215",
    label: "Patriot air defense pledged",
    description:
      "The US announces it will send a Patriot missile defense battery to Ukraine, the most advanced air defense system provided to date",
  },
  {
    date: "20221221",
    label: "Zelenskyy visits Washington",
    description:
      "President Zelenskyy makes his first foreign trip since the invasion, addressing a joint session of the US Congress",
  },
  {
    date: "20221231",
    label: "New Year's Eve barracks strike",
    description:
      "Ukraine strikes a Russian military barracks in Makiivka, Donetsk with HIMARS on New Year's Eve; Russia admits 89 killed",
    lat: 48.041,
    lng: 37.966,
  },

  // ──── 2023 ────────────────────────────────────────────────────────────

  {
    date: "20230111",
    label: "Soledar captured by Russia",
    description:
      "Wagner mercenaries capture the salt-mining town of Soledar after brutal fighting, a prelude to the larger Bakhmut offensive",
    lat: 48.679,
    lng: 38.094,
  },
  {
    date: "20230114",
    label: "Dnipro apartment building struck",
    description:
      "A Russian Kh-22 cruise missile strikes a residential apartment building in Dnipro, killing at least 46 civilians in one of the deadliest single strikes on a residential target",
    lat: 48.464,
    lng: 35.046,
  },
  {
    date: "20230121",
    label: "Tanks pledged",
    description: "Western allies pledge Leopard 2 and M1 Abrams tanks to Ukraine",
  },
  {
    date: "20230125",
    label: "Leopard 2 tanks approved",
    description:
      "Germany approves transfer of Leopard 2 tanks to Ukraine and allows other nations to re-export theirs, breaking a policy taboo",
  },
  {
    date: "20230220",
    label: "Biden visits Kyiv",
    description:
      "President Biden makes an unannounced visit to Kyiv, walking with Zelenskyy as air-raid sirens sound, pledging continued US support",
    lat: 50.45,
    lng: 30.52,
  },
  {
    date: "20230224",
    label: "First anniversary of invasion",
    description:
      "Ukraine marks one year since Russia's full-scale invasion with global rallies of support and renewed Western pledges of military and financial aid",
    lat: 50.45,
    lng: 30.52,
  },
  {
    date: "20230224",
    label: "China proposes peace framework",
    description:
      "China releases a 12-point position paper calling for a political settlement to the Ukraine conflict; Western nations express skepticism over the plan's neutrality",
  },
  {
    date: "20230317",
    label: "ICC arrest warrant for Putin",
    description:
      "The International Criminal Court issues an arrest warrant for President Putin for the war crime of unlawful deportation of Ukrainian children",
  },
  {
    date: "20230404",
    label: "Finland joins NATO",
    description:
      "Finland officially joins NATO, doubling the alliance's border with Russia — a direct consequence of Russia's invasion",
  },
  {
    date: "20230411",
    label: "Pentagon leaks",
    description:
      "Classified Pentagon documents leak online revealing details of Ukraine's military capabilities and Western intelligence assessments",
  },
  {
    date: "20230503",
    label: "Kremlin drone incident",
    description:
      "Two drones strike the Kremlin Senate Palace in Moscow; Russia accuses Ukraine of an assassination attempt on Putin; Ukraine denies involvement",
    lat: 55.752,
    lng: 37.618,
  },
  {
    date: "20230519",
    label: "F-16 training approved",
    description:
      "President Biden agrees at the G7 summit in Hiroshima to support an international coalition to train Ukrainian pilots on F-16 fighter jets",
  },
  {
    date: "20230520",
    label: "Bakhmut falls",
    description:
      "Russia captures Bakhmut after the longest and bloodiest battle of the war (over 10 months). Both sides suffer massive casualties",
    lat: 48.595,
    lng: 37.999,
  },
  {
    date: "20230522",
    label: "Belgorod incursion",
    description:
      "Anti-Putin Russian volunteer fighters cross from Ukraine into Belgorod oblast in an armed incursion, briefly seizing border positions before withdrawing",
    lat: 50.577,
    lng: 36.587,
  },
  {
    date: "20230606",
    label: "Kakhovka Dam destroyed",
    description:
      "The Kakhovka Dam on the Dnipro River is destroyed, causing catastrophic flooding, displacing tens of thousands, and draining the reservoir",
    lat: 46.774,
    lng: 33.372,
  },
  {
    date: "20230608",
    label: "Nova Kakhovka flooding",
    description:
      "Floodwaters from the Kakhovka Dam breach devastate communities downstream; Ukraine accuses Russia of ecocide as rescue operations begin",
    lat: 46.755,
    lng: 33.374,
  },
  {
    date: "20230610",
    label: "Summer counteroffensive begins",
    description:
      "Ukraine launches its long-anticipated summer counteroffensive in southern Zaporizhzhia and western Donetsk directions",
    lat: 47.5,
    lng: 35.5,
  },
  {
    date: "20230624",
    label: "Wagner mutiny",
    description:
      "Wagner Group leader Prigozhin launches brief armed rebellion, marching toward Moscow before standing down",
    lat: 51.733,
    lng: 39.853,
  },
  {
    date: "20230711",
    label: "Cluster munitions to Ukraine",
    description:
      "The US announces provision of controversial cluster munitions (DPICM) to Ukraine to address ammunition shortages",
  },
  {
    date: "20230712",
    label: "Sweden NATO path cleared",
    description:
      "Turkey drops its objection to Sweden's NATO membership at the Vilnius summit, clearing the path for accession",
  },
  {
    date: "20230717",
    label: "Kerch Bridge struck again",
    description:
      "Ukrainian naval drones strike the Kerch Strait Bridge connecting Russia to Crimea, damaging a road span and disrupting logistics to occupied territory",
    lat: 45.314,
    lng: 36.505,
  },
  {
    date: "20230717",
    label: "Black Sea Grain Deal collapses",
    description:
      "Russia withdraws from the Black Sea Grain Initiative, resuming attacks on Odesa port infrastructure and global grain shipments",
    lat: 46.484,
    lng: 30.735,
  },
  {
    date: "20230723",
    label: "Odesa cathedral struck",
    description:
      "A Russian missile strikes the Transfiguration Cathedral in Odesa, a UNESCO World Heritage site, during an attack on port infrastructure",
    lat: 46.484,
    lng: 30.741,
  },
  {
    date: "20230804",
    label: "Novorossiysk port attacked",
    description:
      "Ukrainian naval drones attack the Russian Black Sea port of Novorossiysk, damaging the landing ship Olenegorsky Gornyak and disrupting naval operations",
    lat: 44.718,
    lng: 37.795,
  },
  {
    date: "20230823",
    label: "Prigozhin killed",
    description:
      "Wagner leader Yevgeny Prigozhin dies in plane crash two months after aborted mutiny",
  },
  {
    date: "20230904",
    label: "Robotyne liberated",
    description:
      "Ukrainian forces recapture the village of Robotyne in Zaporizhzhia oblast, the main breach point in the counteroffensive's southern axis",
    lat: 47.448,
    lng: 35.835,
  },
  {
    date: "20230913",
    label: "Sevastopol drydock strike",
    description:
      "Ukrainian Storm Shadow cruise missiles strike the Sevastopol drydocks in Crimea, severely damaging the submarine Rostov-on-Don and the landing ship Minsk",
    lat: 44.608,
    lng: 33.548,
  },
  {
    date: "20230919",
    label: "Zelenskyy addresses UN General Assembly",
    description:
      "President Zelenskyy addresses the UN General Assembly in New York for the first time in person since the invasion, calling for a just peace and accountability",
    lat: 40.749,
    lng: -73.968,
  },
  {
    date: "20230922",
    label: "Black Sea Fleet HQ struck",
    description:
      "Ukraine strikes the Russian Black Sea Fleet headquarters in Sevastopol, Crimea with cruise missiles, significantly damaging the complex",
    lat: 44.616,
    lng: 33.526,
  },
  {
    date: "20231005",
    label: "Hroza village attack",
    description:
      "A Russian missile strikes a wake ceremony in the village of Hroza, Kharkiv oblast, killing 52 civilians — one of the deadliest single strikes on civilians",
    lat: 49.154,
    lng: 36.919,
  },
  {
    date: "20231010",
    label: "Russia's Avdiivka offensive begins",
    description:
      "Russia launches a major assault on Avdiivka in Donetsk oblast with massed infantry and armored attacks, beginning a months-long battle for the fortified city",
    lat: 48.14,
    lng: 37.742,
  },
  {
    date: "20231017",
    label: "ATACMS first used",
    description:
      "Ukraine fires US-supplied ATACMS ballistic missiles for the first time, striking Russian-occupied airfields in Berdyansk and Luhansk oblasts",
    lat: 46.761,
    lng: 36.799,
  },
  {
    date: "20231104",
    label: "Counteroffensive assessed",
    description:
      "Ukraine's top general Zaluzhny publicly acknowledges the counteroffensive has reached a stalemate, sparking debate about strategy",
  },
  {
    date: "20231117",
    label: "Deep Crimea strikes",
    description:
      "Ukrainian naval drones and missiles strike Russian ships and air defenses deep in occupied Crimea, degrading Black Sea Fleet capabilities",
    lat: 44.62,
    lng: 33.53,
  },
  {
    date: "20231206",
    label: "US aid package stalls",
    description:
      "A $61 billion US aid package for Ukraine fails to advance in the Senate as Republicans demand border security provisions, threatening a critical supply line",
  },
  {
    date: "20231215",
    label: "EU opens accession talks",
    description:
      "The European Council agrees to open EU accession negotiations with Ukraine, a landmark step toward European integration",
  },
  {
    date: "20231229",
    label: "Largest missile barrage",
    description:
      "Russia launches its largest aerial assault of the war — 158 missiles and drones — targeting cities across Ukraine; Ukraine intercepts most but suffers significant damage",
    lat: 50.45,
    lng: 30.52,
  },

  // ──── 2024 ────────────────────────────────────────────────────────────

  {
    date: "20240108",
    label: "Avdiivka encirclement tightens",
    description:
      "Russia intensifies its encirclement of Avdiivka in Donetsk oblast with waves of infantry and armored assaults",
    lat: 48.14,
    lng: 37.742,
  },
  {
    date: "20240208",
    label: "Zaluzhny dismissed",
    description:
      "President Zelenskyy replaces Commander-in-Chief Zaluzhny with General Oleksandr Syrskyi amid strategic disagreements",
  },
  {
    date: "20240217",
    label: "Avdiivka falls",
    description:
      "Ukrainian forces withdraw from Avdiivka after months of intense fighting; Russia captures the strategically important Donetsk suburb",
    lat: 48.14,
    lng: 37.742,
  },
  {
    date: "20240217",
    label: "Navalny death",
    description:
      "Russian opposition leader Alexei Navalny dies in Arctic penal colony under suspicious circumstances",
  },
  {
    date: "20240307",
    label: "Sweden joins NATO",
    description:
      "Sweden officially joins NATO as its 32nd member, ending two centuries of military non-alignment due to Russia's war",
  },
  {
    date: "20240322",
    label: "Crocus City Hall attack",
    description:
      "ISIS-linked gunmen kill 145 at a Moscow concert hall; Putin initially tries to blame Ukraine before ISIS claims responsibility",
    lat: 55.824,
    lng: 37.389,
  },
  {
    date: "20240402",
    label: "Trypillia power station destroyed",
    description:
      "Russia destroys the Trypillia thermal power plant near Kyiv with missiles, the largest energy facility in the Kyiv region",
    lat: 50.127,
    lng: 30.788,
  },
  {
    date: "20240424",
    label: "ATACMS deliveries begin",
    description:
      "The US quietly delivers long-range ATACMS ballistic missiles to Ukraine; first confirmed use against Russian targets in occupied territory",
  },
  {
    date: "20240510",
    label: "Kharkiv direction offensive",
    description:
      "Russia launches a cross-border ground offensive in northern Kharkiv oblast near Vovchansk, opening a new front",
    lat: 50.291,
    lng: 36.943,
  },
  {
    date: "20240602",
    label: "F-16 transfers confirmed",
    description:
      "Denmark and the Netherlands confirm first F-16 fighter jets will arrive in Ukraine in summer 2024",
  },
  {
    date: "20240613",
    label: "G7 frozen assets",
    description:
      "G7 leaders agree to use interest from $300B in frozen Russian assets to provide $50B loan to Ukraine",
  },
  {
    date: "20240615",
    label: "Bürgenstock peace summit",
    description:
      "Over 90 nations attend a Ukraine peace summit in Switzerland; Russia is not invited. Final communiqué calls for territorial integrity but lacks enforcement",
    lat: 46.997,
    lng: 8.382,
  },
  {
    date: "20240708",
    label: "Okhmatdyt children's hospital struck",
    description:
      "A Russian missile strikes the Okhmatdyt children's hospital in Kyiv during a massive missile barrage, killing at least two and causing international outrage",
    lat: 50.438,
    lng: 30.517,
  },
  {
    date: "20240719",
    label: "Pokrovsk direction fighting",
    description:
      "Russia intensifies its push toward Pokrovsk, a critical logistics hub in Donetsk oblast, with daily armored and infantry assaults",
    lat: 48.283,
    lng: 37.173,
  },
  {
    date: "20240806",
    label: "Kursk incursion begins",
    description:
      "Ukraine launches a surprise cross-border offensive into Russia's Kursk oblast, capturing hundreds of square kilometers of Russian territory",
    lat: 51.416,
    lng: 34.695,
  },
  {
    date: "20240820",
    label: "Kursk offensive expands",
    description:
      "Ukrainian forces expand control in Kursk oblast to over 1,000 sq km and capture the town of Sudzha, a key gas transit point",
    lat: 51.189,
    lng: 35.271,
  },
  {
    date: "20240826",
    label: "F-16s operational in Ukraine",
    description:
      "Ukraine confirms F-16 fighter jets are flying combat missions, marking a new era in its air defense capabilities",
  },
  {
    date: "20240901",
    label: "Poltava military strike",
    description:
      "Russian ballistic missiles hit a military training facility in Poltava, killing at least 55 soldiers in one of the deadliest strikes on Ukrainian military",
    lat: 49.589,
    lng: 34.552,
  },
  {
    date: "20241003",
    label: "DPRK troops arrive in Russia",
    description:
      "US and South Korean intelligence confirm North Korean troops are being transported to Russia for deployment to the front lines",
  },
  {
    date: "20241028",
    label: "Georgia pro-EU protests",
    description:
      "Mass protests erupt in Georgia after disputed elections; the conflict highlights Russia's regional influence and the war's geopolitical ripple effects",
    lat: 41.694,
    lng: 44.833,
  },
  {
    date: "20241105",
    label: "US election",
    description:
      "Donald Trump wins US presidential election, casting uncertainty over Ukraine support",
  },
  {
    date: "20241119",
    label: "ATACMS strikes inside Russia",
    description:
      "Ukraine fires US-supplied ATACMS missiles at targets inside Russia for the first time, after Biden authorizes long-range strikes on Russian territory",
  },
  {
    date: "20241121",
    label: "Oreshnik missile fired",
    description:
      "Russia fires an experimental Oreshnik intermediate-range ballistic missile at Dnipro, a dramatic escalation in its weapons use",
    lat: 48.464,
    lng: 35.046,
  },
  {
    date: "20241125",
    label: "Storm Shadow strikes inside Russia",
    description:
      "UK-supplied Storm Shadow cruise missiles are used by Ukraine against targets inside Russia, following UK authorization",
  },
  {
    date: "20241216",
    label: "DPRK troops deployed",
    description: "North Korean soldiers confirmed fighting alongside Russian forces in Kursk",
    lat: 51.416,
    lng: 34.695,
  },
  {
    date: "20241225",
    label: "Russian gas transit via Ukraine ends",
    description:
      "Ukraine confirms it will not renew the gas transit agreement with Russia set to expire on January 1, ending decades of energy dependency",
  },

  // ──── 2025 ────────────────────────────────────────────────────────────

  {
    date: "20250101",
    label: "Gas transit ends",
    description:
      "Russian gas transit through Ukraine officially ceases after the transit agreement expires, cutting a major revenue stream and reshaping European energy supply",
  },
  {
    date: "20250115",
    label: "Winter energy barrage",
    description:
      "Russia launches a combined missile and drone attack targeting energy infrastructure across Ukraine, causing widespread power grid shutdowns during winter",
    lat: 50.45,
    lng: 30.52,
  },
  {
    date: "20250120",
    label: "Trump inaugurated",
    description: "Trump takes office, signals prioritization of ending the war",
  },
  {
    date: "20250131",
    label: "Russia recaptures Kursk territory",
    description:
      "Russian forces, supported by North Korean troops, recapture most of the territory in Kursk oblast that Ukraine had seized in its August 2024 incursion",
    lat: 51.416,
    lng: 34.695,
  },
  {
    date: "20250212",
    label: "Minerals deal tensions",
    description:
      "Tensions emerge over a proposed US-Ukraine minerals deal; Trump links continued support to resource access, straining relations with Zelenskyy",
  },
  {
    date: "20250219",
    label: "Kellogg visits Kyiv",
    description:
      "Trump's special envoy Keith Kellogg arrives in Kyiv for a three-day visit, meeting President Zelenskyy and officials as part of shuttle diplomacy to broker a ceasefire",
    lat: 50.45,
    lng: 30.52,
  },
  {
    date: "20250224",
    label: "3rd anniversary",
    description: "Three years since Russia's full-scale invasion of Ukraine",
    lat: 50.45,
    lng: 30.52,
  },
  {
    date: "20250228",
    label: "Zelenskyy-Trump White House clash",
    description:
      "A tense Oval Office meeting between Zelenskyy and Trump results in no signed minerals deal; Zelenskyy is escorted out after heated exchange",
  },
  {
    date: "20250311",
    label: "Ukraine accepts ceasefire proposal",
    description:
      "Ukraine agrees to a US-brokered 30-day ceasefire proposal following talks in Saudi Arabia; implementation is conditional on Russian acceptance",
  },
];
