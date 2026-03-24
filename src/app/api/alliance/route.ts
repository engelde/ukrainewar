import { NextResponse } from "next/server";
import { INTERNATIONAL_SUPPORT } from "@/data/international-support";

const WORLD_GEOJSON_URL =
  "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";

// ISO alpha-3 → alpha-2 mapping for countries in our support data
const ISO3_TO_ISO2: Record<string, string> = {
  USA: "US",
  GBR: "GB",
  DEU: "DE",
  FRA: "FR",
  CAN: "CA",
  POL: "PL",
  AUS: "AU",
  JPN: "JP",
  NLD: "NL",
  NOR: "NO",
  ITA: "IT",
  ESP: "ES",
  SWE: "SE",
  DNK: "DK",
  FIN: "FI",
  BEL: "BE",
  CZE: "CZ",
  PRT: "PT",
  GRC: "GR",
  ROU: "RO",
  BGR: "BG",
  HRV: "HR",
  EST: "EE",
  LVA: "LV",
  LTU: "LT",
  SVK: "SK",
  IRL: "IE",
  NZL: "NZ",
  KOR: "KR",
  CHE: "CH",
  RUS: "RU",
  CHN: "CN",
  BLR: "BY",
  IRN: "IR",
  PRK: "KP",
  SYR: "SY",
  CUB: "CU",
  NIC: "NI",
  ERI: "ER",
  MLI: "ML",
  MMR: "MM",
  UKR: "UA",
};

export async function GET() {
  try {
    const res = await fetch(WORLD_GEOJSON_URL, {
      next: { revalidate: 7 * 24 * 60 * 60 },
    });
    if (!res.ok) return NextResponse.json({ error: "Failed to fetch" }, { status: 502 });

    const world = (await res.json()) as GeoJSON.FeatureCollection;

    const ukraineCodes = new Set(
      INTERNATIONAL_SUPPORT.filter((c) => c.side === "ukraine").map((c) => c.countryCode),
    );
    const russiaCodes = new Set(
      INTERNATIONAL_SUPPORT.filter((c) => c.side === "russia").map((c) => c.countryCode),
    );

    const features: GeoJSON.Feature[] = [];

    for (const feature of world.features) {
      const iso3 = (feature.properties?.["ISO_A3"] ?? feature.properties?.["ISO3"]) as string;
      const iso2 = ISO3_TO_ISO2[iso3];
      if (!iso2) continue;

      // Skip Ukraine and Russia themselves — they're already rendered differently
      if (iso2 === "UA" || iso2 === "RU") continue;

      let side: string | null = null;
      if (ukraineCodes.has(iso2)) side = "ukraine";
      else if (russiaCodes.has(iso2)) side = "russia";

      if (side) {
        features.push({
          ...feature,
          properties: { ...feature.properties, side, iso2 },
        });
      }
    }

    return NextResponse.json({
      type: "FeatureCollection",
      features,
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
