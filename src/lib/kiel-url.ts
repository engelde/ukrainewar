const KIEL_XLSX_BASE =
  "https://www.kielinstitut.de/fileadmin/Dateiverwaltung/IfW-Publications/fis-import/62a94ad1-2d28-401e-afd0-8a8089b48f2a-Ukraine_Support_Tracker_Release_";

const KNOWN_RELEASE = 27;
const PROBE_AHEAD = 3;
const DISCOVERY_TTL = 24 * 60 * 60 * 1000; // 24 hours

let discoveredRelease: number | null = null;
let discoveredAt = 0;

export function buildKielUrl(release: number): string {
  return `${KIEL_XLSX_BASE}${release}.xlsx`;
}

/**
 * Probes the Kiel Institute server for the latest XLSX release.
 * Starts from the last known release, tries +1…+3, and returns
 * the highest release that responds with HTTP 200.
 */
export async function discoverLatestRelease(): Promise<{ release: number; url: string }> {
  if (discoveredRelease && Date.now() - discoveredAt < DISCOVERY_TTL) {
    return { release: discoveredRelease, url: buildKielUrl(discoveredRelease) };
  }

  const baseline = discoveredRelease ?? KNOWN_RELEASE;
  let bestRelease = 0;

  // Probe from highest candidate downward — first hit wins
  for (let r = baseline + PROBE_AHEAD; r >= baseline; r--) {
    try {
      const res = await fetch(buildKielUrl(r), { method: "HEAD" });
      if (res.ok) {
        bestRelease = r;
        break;
      }
    } catch {
      // network error — continue probing
    }
  }

  if (bestRelease === 0) {
    bestRelease = KNOWN_RELEASE;
  }

  discoveredRelease = bestRelease;
  discoveredAt = Date.now();

  return { release: bestRelease, url: buildKielUrl(bestRelease) };
}
