const KIEL_PAGE_URL =
  "https://www.kielinstitut.de/research/topics/war-against-ukraine/ukraine-support-tracker/";

// Fallback URL if page scraping fails — update when a new release is confirmed
const FALLBACK_URL =
  "https://www.kielinstitut.de/fileadmin/Dateiverwaltung/IfW-Publications/fis-import/bc5059ba-ef38-4f08-988a-746a03905a6c-Ukraine_Support_Tracker__Release_31.xlsx";
const FALLBACK_RELEASE = 31;

const DISCOVERY_TTL = 24 * 60 * 60 * 1000; // 24 hours

let cachedUrl: string | null = null;
let cachedRelease: number | null = null;
let discoveredAt = 0;

/**
 * Scrapes the Kiel Institute tracker page to find the current XLSX download URL.
 * The UUID prefix in the filename changes with each major release, so probing
 * a fixed URL pattern is unreliable. Returns the fallback if scraping fails.
 */
export async function discoverLatestRelease(): Promise<{ release: number; url: string }> {
  if (cachedUrl && cachedRelease && Date.now() - discoveredAt < DISCOVERY_TTL) {
    return { release: cachedRelease, url: cachedUrl };
  }

  try {
    const res = await fetch(KIEL_PAGE_URL);
    if (res.ok) {
      const html = await res.text();
      // Extract the XLSX path — UUID prefix changes per major release, and the
      // separator before "Release" has varied between "_" and "__".
      const match = html.match(
        /(fileadmin\/Dateiverwaltung\/IfW-Publications\/fis-import\/[^"]*-Ukraine_Support_Tracker_+Release_(\d+)\.xlsx)/,
      );
      if (match) {
        const release = parseInt(match[2], 10);
        const url = `https://www.kielinstitut.de/${match[1]}`;
        cachedUrl = url;
        cachedRelease = release;
        discoveredAt = Date.now();
        return { release, url };
      }
    }
  } catch {
    // network error — fall through to fallback
  }

  console.warn(
    `Kiel release discovery failed; using fallback Release ${FALLBACK_RELEASE}. ` +
      "Check the tracker page markup and update FALLBACK_URL in src/lib/kiel-url.ts.",
  );
  return { release: FALLBACK_RELEASE, url: FALLBACK_URL };
}
