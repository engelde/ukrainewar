import { NextResponse } from "next/server";
import { INTERNATIONAL_SUPPORT } from "@/data/international-support";

const WORLD_GEOJSON_URL =
  "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";

// Fallback: country name → ISO alpha-2 for entries missing codes in the GeoJSON
const NAME_TO_ISO2: Record<string, string> = {
  France: "FR",
  Norway: "NO",
};

// In-memory cache for the filtered result (avoids re-fetching 19MB on every request)
let cachedResult: { data: GeoJSON.FeatureCollection; ts: number } | null = null;
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function GET() {
  try {
    if (cachedResult && Date.now() - cachedResult.ts < CACHE_TTL) {
      return NextResponse.json(cachedResult.data);
    }

    const res = await fetch(WORLD_GEOJSON_URL, { cache: "no-store" });
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
      let iso2 = (feature.properties?.["ISO3166-1-Alpha-2"] ?? "") as string;
      if (!iso2 || iso2 === "-99") {
        const name = (feature.properties?.name ?? "") as string;
        iso2 = NAME_TO_ISO2[name] ?? "";
      }
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

    const result: GeoJSON.FeatureCollection = { type: "FeatureCollection", features };
    cachedResult = { data: result, ts: Date.now() };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
