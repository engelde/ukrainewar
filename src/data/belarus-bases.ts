export interface BelarusBase {
  id: string;
  name: string;
  lat: number;
  lng: number;
  baseType: "airfield" | "ground-forces" | "missile" | "border-crossing";
  significance: string;
  warContext: string;
}

/**
 * Belarusian military facilities and border crossings relevant to the
 * Russo-Ukrainian War. Belarus served as a staging ground for the
 * initial northern offensive in February 2022 and remains a persistent
 * threat axis.
 */
export const BELARUS_BASES: BelarusBase[] = [
  // -- Airfields -------------------------------------------------------

  {
    id: "zyabrovka",
    name: "Zyabrovka Airfield",
    lat: 52.286,
    lng: 30.717,
    baseType: "airfield",
    significance: "Military airfield near Gomel, 50 km from the Ukrainian border.",
    warContext:
      "Used as a staging area for Russian forces and helicopters " +
      "during the early phase of the 2022 invasion.",
  },
  {
    id: "luninets",
    name: "Luninets Airfield",
    lat: 52.158,
    lng: 26.762,
    baseType: "airfield",
    significance:
      "Belarusian Air Force base in the Brest region supporting " + "fighter operations.",
    warContext:
      "Hosted Russian fighter and attack aircraft during joint " +
      "exercises and early war operations.",
  },
  {
    id: "baranovichi",
    name: "Baranovichi Airfield",
    lat: 53.098,
    lng: 25.96,
    baseType: "airfield",
    significance: "Major Belarusian Air Force base housing MiG-29 and Su-30SM " + "aircraft.",
    warContext:
      "Primary Belarusian air-defense hub; Russian aircraft operated " +
      "from here during the initial invasion phase.",
  },
  {
    id: "machulishchi",
    name: "Machulishchi Airfield",
    lat: 53.771,
    lng: 27.633,
    baseType: "airfield",
    significance:
      "Military airfield south of Minsk, historically used for " + "strategic aviation assets.",
    warContext:
      "Reported deployment site for Russian Oreshnik IRBM system, " +
      "significantly escalating the strategic threat from Belarusian " +
      "territory.",
  },

  // -- Ground Forces ---------------------------------------------------

  {
    id: "gomel-forces",
    name: "Gomel Area Forces",
    lat: 52.426,
    lng: 31.0,
    baseType: "ground-forces",
    significance:
      "Concentration of Belarusian and Russian ground forces near " + "the Ukraine-Belarus border.",
    warContext:
      "Launch point for the northern axis invasion toward Chernihiv " +
      "in February 2022; forces remain a standing threat to northern " +
      "Ukraine.",
  },
  {
    id: "brest-garrison",
    name: "Brest Garrison",
    lat: 52.098,
    lng: 23.734,
    baseType: "ground-forces",
    significance:
      "Major garrison near the Poland-Belarus border, one of " +
      "Belarus's largest military installations.",
    warContext:
      "Positioned at the junction of NATO and Ukrainian concerns; " +
      "forces here complicate NATO logistics planning.",
  },
  {
    id: "osipovichi",
    name: "Osipovichi Base",
    lat: 53.315,
    lng: 28.66,
    baseType: "ground-forces",
    significance:
      "Central Belarusian staging area with large ammunition depots " + "and rail infrastructure.",
    warContext:
      "Central mobilization point for Russian and Belarusian forces; " +
      "rail links enable rapid force projection southward.",
  },

  // -- Border Crossings ------------------------------------------------

  {
    id: "novaya-guta",
    name: "Novaya Guta / Novi Yarylovychi Crossing",
    lat: 51.986,
    lng: 31.63,
    baseType: "border-crossing",
    significance: "Major road border crossing between Belarus and Chernihiv " + "oblast, Ukraine.",
    warContext:
      "Route used by Russian forces entering Chernihiv oblast during " +
      "the February 2022 northern offensive.",
  },
  {
    id: "terehova",
    name: "Terehova / Senkivka Crossing",
    lat: 52.297,
    lng: 32.069,
    baseType: "border-crossing",
    significance: "Eastern border crossing between Belarus and Chernihiv " + "oblast, Ukraine.",
    warContext:
      "Secondary axis of advance into Chernihiv oblast during the " + "initial 2022 invasion.",
  },
  {
    id: "mokrany",
    name: "Mokrany / Domanove Crossing",
    lat: 51.824,
    lng: 24.254,
    baseType: "border-crossing",
    significance: "Western border crossing between Belarus and Volyn oblast, " + "Ukraine.",
    warContext:
      "Monitored crossing on the Volyn axis; potential route for " +
      "any future thrust toward western Ukraine.",
  },
];
