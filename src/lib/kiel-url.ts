const KIEL_PAGE_URL = "https://www.ifw-kiel.de/topics/war-against-ukraine/ukraine-support-tracker/";

// Fallback URL if page scraping fails — update when a new release is confirmed
const FALLBACK_URL =
  "https://www.kielinstitut.de/fileadmin/Dateiverwaltung/IfW-Publications/fis-import/c80bbebb-b4e7-4581-8f32-e32a1da7ecfa-Ukraine_Support_Tracker_Release_28.xlsx";
const FALLBACK_RELEASE = 28;

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
      // Extract the XLSX path — UUID prefix changes per major release
      const match = html.match(
        /(fileadmin\/Dateiverwaltung\/IfW-Publications\/fis-import\/[^"]*-Ukraine_Support_Tracker_Release_(\d+)\.xlsx)/,
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

  return { release: FALLBACK_RELEASE, url: FALLBACK_URL };
}
