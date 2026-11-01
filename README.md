<div align="center">

<img src="public/icon.png" alt="Russo-Ukrainian War Tracker" width="80" />

# Russo-Ukrainian War Tracker

### [ukrainewar.app](https://ukrainewar.app)

**An independent research project visualizing the Russo-Ukrainian war through interactive maps, timelines, and comprehensive conflict data.**

[![Deploy](https://github.com/engelde/ukrainewar/actions/workflows/deploy.yml/badge.svg)](https://github.com/engelde/ukrainewar/actions/workflows/deploy.yml)
[![License: AGPL-3.0-or-later](https://img.shields.io/badge/License-AGPL--3.0--or--later-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)

---

*Built to inform, not to sensationalize. This is an independent research project — not affiliated with any government, military, or news organization. It aims to provide accessible, data-driven insight into the human and material costs of the conflict.*

</div>

---

## Overview

The Russo-Ukrainian War Tracker is an independent, open-source research project that consolidates data from 15+ public sources into a single interactive experience. Users can explore territory control changes, equipment losses, casualty statistics, humanitarian impact, bilateral aid, energy infrastructure status, air defense performance, sanctions, and strategic asset positions — all synchronized to a central timeline that begins with the Russian military buildup in March 2021.

All data is sourced from publicly available APIs and datasets. The application does not generate original analysis or make claims beyond what the underlying sources report.

The interface is built around an explorable map rendered in muted dark tones, with data panels, counters, and visualizations layered on top.

---

## Features

### Interactive Map

- Full-screen **MapLibre GL** vector map with dark CartoDB base tiles
- **Territory control** overlays showing Russian-occupied areas over time
- **Frontline** visualization tracking the contact line
- **Equipment loss markers** — geotagged, categorized, and filterable by type and status
- **Conflict event clusters** showing ACLED battle and violence data
- **Conflict event heatmap** showing regional intensity by oblast
- **Major battle locations** with historical context
- **Ukraine border** and oblast boundary layers
- **Troop movement arrows** — 27 curated military operations with animated directional paths (cyan for Ukraine, orange for Russia)
- **Pre-invasion buildup** — Russian force groupings and staging areas from March 2021 to February 2022
- **Infrastructure** — 5 Ukrainian nuclear power plants, 6 dams, 4 bridges, 9 ports, plus energy assets and gas transit pipelines, each with status indicators
- **Military bases** — 14 NATO eastern-flank bases and battlegroups, 10 Belarus positions, 17 Ukrainian installations, and 20 Russian positions near Ukraine
- **NASA FIRMS thermal anomalies** — near-real-time satellite fire/strike detections (VIIRS)
- **International support overlay** — countries shaded by alignment (off by default)
- Missile attack locations and custom canvas-drawn map icons for all infrastructure and military layers
- 13 layer toggles in the options menu: Territory, Frontline, Equipment, Border, Conflicts, Heatmap, Battles, Operations, Infrastructure, Military Bases, Thermal, Intl Support, and Buildup

### Central Timeline

- Scrubbable timeline spanning **March 2021 (pre-invasion buildup) to present**
- **Playback controls** with adjustable speed (0.25x to 8x)
- **Key events** from Wikidata, ACLED, GeoConfirmed (post-ACLED period), curated missile attacks, and editorial sources
- **Waveform visualization** showing daily Russian loss intensity
- Calendar picker for jumping to specific dates
- **Data freshness indicator** showing how current each data pipeline is (via `/api/status`)

### Live Statistics

- **Animated counters** for Russian military losses:
  - Personnel, tanks, armored vehicles, artillery systems
  - MLRS, UAVs, air defense systems, jets, helicopters
  - Ships/boats, supply vehicles
- **Sparkline trend charts** showing recent daily trends
- Figures as reported by the Ukrainian Ministry of Defence
- All statistics update dynamically during timeline playback

### Event Sidebar

- Chronological event browser
- Filterable by category: Battles, Territory, Political, Military, Humanitarian, Milestones
- Filterable by conflict events from ACLED data
- Click-to-navigate: selecting an event jumps the timeline and map
- Auto-tracking during timeline playback

### Bilateral Aid Panel

- **Kiel Institute Ukraine Support Tracker** data
- Total aid breakdown: Military, Financial, Humanitarian (EUR billions)
- **Top 10 donor countries** ranked by total commitment
- **Monthly allocation trends** with cumulative totals
- **Weapons by category** plus a list of notable systems delivered or pledged

### Humanitarian Panel

- **UNHCR refugee data** — total refugees by year, top destination countries, IDPs
- **OCHA funding status** — humanitarian appeal requirements vs. actual funding
- **Civilian casualty data** — OHCHR monthly, annual, and cumulative totals
- All humanitarian data updates during timeline playback with year-based interpolation

### Equipment Loss Detail

- Click any equipment marker for detailed information
- Equipment type, model, status (destroyed/damaged/captured/abandoned)
- Date, nearest location, and coordinates
- Color-coded by status: red (destroyed), orange (damaged), green (captured), purple (abandoned)

### Energy Panel

- **Electricity generation** data from the ENTSO-E Transparency Platform
- **Damaged capacity tracking** — pre-war vs. current generation capacity
- **Plant-level status** for thermal, nuclear, hydro, and renewable facilities
- **Gas transit monitoring** — Ukrainian pipeline transit volumes via ENTSOG
- Data refreshes every 6–12 hours depending on source

### Infrastructure Panel

- Status of dams, bridges, ports, nuclear plants, and other critical infrastructure
- Each item's status (operational, damaged, destroyed, occupied) is computed for the selected timeline date

### Air Defense Panel

- **Missile and drone attack statistics** aggregated from Ukrainian Air Force reports
- **Interception rates** by weapon type (cruise missiles, ballistic missiles, Shaheds)
- **Attack history** — 40 curated major attack waves from February 2022 through May 2025 (historical dataset, not continuously updated)
- Integrated into the central timeline as filterable events

### International Support Panel

- **Global alignment breakdown** — 31 pro-Ukraine and 10 pro-Russia countries with proportional bar
- **Support type badges** — Military, Financial, Humanitarian, Political, Sanctions, Troops
- **Aid totals** per country and combined
- Country details with notable contributions and descriptions
- Data compiled from the Kiel Institute and government sources

### Ukrainian Losses Panel

- **Casualty estimates** compiled from multiple independent sources
- **Mediazona/BBC confirmed** — verified deaths by name (conservative minimum)
- **Official statements and intelligence assessments** — Ukrainian, European, US, UK, and Norwegian figures with dates and sources
- **OHCHR civilian casualties** — UN-verified minimum
- Clear disclaimers about data uncertainty and methodology differences

### Sanctions Panel

- **27 curated sanctions packages** across EU (14), US (6), UK (3), Canada, Japan, Australia, Switzerland
- **Summary statistics** — total packages, individuals, and entities sanctioned
- **Imposer breakdown** — color-coded bar chart by sanctioning body
- **Key measures** — 10 major bans (SWIFT, oil embargo, price cap, diamond ban, etc.)
- **Timeline-aware** — filters to show only sanctions imposed by the selected date
- Data curated from EU Council, US Treasury OFAC, and UK Government sources

### URL State Management

- Timeline date, map position (lat/lng/zoom), hidden layers, open panels, statistics, and sidebar state are persisted in the URL
- Every view is shareable and bookmarkable via [nuqs](https://nuqs.47ng.com/)

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router; Turbopack in dev, webpack for production builds) |
| **Language** | [TypeScript 7](https://typescriptlang.org) |
| **UI Library** | [React 19](https://react.dev) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com) |
| **Components** | [shadcn/ui](https://ui.shadcn.com) on [Base UI](https://base-ui.com), [react-day-picker](https://daypicker.dev) |
| **Maps** | [MapLibre GL](https://maplibre.org) |
| **State** | [Zustand](https://zustand.docs.pmnd.rs) + [nuqs](https://nuqs.47ng.com/) (URL state) |
| **Icons** | [react-icons](https://react-icons.github.io/react-icons/) (Tabler + Game Icons) |
| **Fonts** | [DM Sans](https://fonts.google.com/specimen/DM+Sans) + [DM Mono](https://fonts.google.com/specimen/DM+Mono) |
| **Linting** | [Biome](https://biomejs.dev) |
| **Git Hooks** | [Husky](https://typicode.github.io/husky/) + [commitlint](https://commitlint.js.org/) |
| **Versioning** | [Release Please](https://github.com/googleapis/release-please) |
| **Deployment** | [Cloudflare Workers](https://workers.cloudflare.com) via [OpenNext](https://opennext.js.org/cloudflare) |

---

## API Routes

All `GET` routes are public and return JSON. Routes backed by an upstream API use a persistent cache (file-based in development, Cloudflare KV in production) and serve stale data while refreshing in the background. Routes marked *static* serve data bundled at build time.

| Route | Description | Cache |
|-------|-------------|-------|
| `/api/casualties` | Current Russian personnel and equipment losses (Ukrainian MoD, via [parser API](https://russia-casualties-ukraine-war-parser.vercel.app)) | 4h |
| `/api/casualties/history` | Daily MoD loss totals for a given date ([`lod-db/orc-losses`](https://github.com/lod-db/orc-losses)) | 24h |
| `/api/casualties/daily-totals` | Daily MoD loss series for the timeline waveform (`lod-db/orc-losses`) | 1–24h |
| `/api/losses/stats` | Visually confirmed equipment loss statistics (WarSpotting) | 1h |
| `/api/losses/recent` | Recent visually confirmed losses (WarSpotting) | 6h |
| `/api/losses/trend` | Loss trend series (WarSpotting) | 6h |
| `/api/losses/month` | Geolocated losses for a month (WarSpotting) | 12h |
| `/api/losses/historical` | Geolocated losses for a date (WarSpotting) | 24h |
| `/api/territory` | Latest territory control GeoJSON (DeepState) | 12h |
| `/api/territory/[date]` | Territory control GeoJSON for a past date (DeepState) | 7d |
| `/api/territory/dates` | Available DeepState snapshot dates | *static* |
| `/api/territory/viina` | VIINA territory snapshots, Feb 2022 – Jul 2024 | *static* |
| `/api/events` | Timeline key events (prebuilt from Wikidata, ACLED, GeoConfirmed, curated) | 24h |
| `/api/acled` | ACLED conflict events for the map | 24h |
| `/api/acled/regional` | ACLED regional event counts for the heatmap | 24h |
| `/api/battles` | Major battles, enriched with ACLED data | 24h |
| `/api/humanitarian/refugees` | Refugee and IDP statistics (UNHCR) | 24h |
| `/api/humanitarian/funding` | Humanitarian funding appeals (OCHA via HDX HAPI) | 24h |
| `/api/spending` | Bilateral aid commitments (Kiel Institute) | 7d |
| `/api/sanctions` | Curated sanctions packages merged with the UK OFSI consolidated list | 24h |
| `/api/alliance` | Country alignment GeoJSON | *static* |
| `/api/firms` | NASA FIRMS thermal anomalies (VIIRS) | 3h recent / 30d historical |
| `/api/energy` | Electricity generation and plant status (ENTSO-E) | 6h |
| `/api/energy/gas` | Gas transit through Ukraine (ENTSOG) | 12h |
| `/api/status` | Freshness of each data pipeline | — |

Cache maintenance routes (`POST`, require `Authorization: Bearer $CACHE_REFRESH_SECRET`):

| Route | Purpose |
|-------|---------|
| `/api/cache/refresh` | Refresh ACLED map data in KV (requires ACLED credentials) |
| `/api/cache/refresh-firms` | Pre-warm historical FIRMS data (requires `NASA_FIRMS_KEY`) |
| `/api/cache/purge` | Purge the Cloudflare CDN cache (requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ZONE_ID`) |

---

## Data Sources

This project aggregates data from the following sources. All data is accessed through publicly available APIs and datasets. The project is not endorsed by or affiliated with any of these sources.

| Source | Data Provided | Link |
|--------|--------------|------|
| **WarSpotting** | Visually confirmed Russian equipment losses with geolocation | [warspotting.net](https://warspotting.net) |
| **Ukrainian Ministry of Defence** | Official daily personnel and equipment loss reports (via the [`lod-db/orc-losses`](https://github.com/lod-db/orc-losses) dataset and a community parser API) | [mil.gov.ua](https://www.mil.gov.ua) |
| **Ukrainian Air Force** | Missile and drone attack reports, interception statistics | [t.me/kpszsu](https://t.me/kpszsu) |
| **DeepState Map** | Territory control and frontline GeoJSON (via the [`cyterat/deepstate-map-data`](https://github.com/cyterat/deepstate-map-data) mirror) | [deepstatemap.live](https://deepstatemap.live) |
| **ACLED** | Armed conflict event data — battles, civilian targeting, protests (API and HDX regional files) | [acleddata.com](https://acleddata.com) |
| **Wikidata** | Structured data on named events, battles, and offensives (via SPARQL) | [wikidata.org](https://www.wikidata.org) |
| **GeoConfirmed** | OSINT photo/video-verified geolocated events (used to fill the post-ACLED gap) | [geoconfirmed.org](https://geoconfirmed.org) |
| **HDX / OCHA** | Humanitarian response data, funding status | [data.humdata.org](https://data.humdata.org) |
| **OHCHR** | UN-verified civilian casualty statistics | [ohchr.org](https://www.ohchr.org) |
| **UNHCR** | Refugee and internally displaced persons statistics | [data.unhcr.org](https://data.unhcr.org) |
| **Kiel Institute** | Ukraine Support Tracker — bilateral military, financial, and humanitarian aid | [kielinstitut.de](https://www.kielinstitut.de/research/topics/war-against-ukraine/ukraine-support-tracker/) |
| **Mediazona / BBC** | Confirmed-by-name Ukrainian casualty investigations | [zona.media](https://en.zona.media/article/2022/05/20/casualties_eng) |
| **VIINA** | Territorial control derived from news coverage (Zhukov & Ayers) | [github.com/zhukovyuri/VIINA](https://github.com/zhukovyuri/VIINA) |
| **NASA FIRMS** | Near-real-time satellite thermal anomaly detections (VIIRS) | [firms.modaps.eosdis.nasa.gov](https://firms.modaps.eosdis.nasa.gov) |
| **ENTSO-E** | European electricity generation data (Transparency Platform) | [transparency.entsoe.eu](https://transparency.entsoe.eu) |
| **ENTSOG** | European gas transit flow data (Transparency Platform) | [transparency.entsog.eu](https://transparency.entsog.eu) |
| **UK OFSI** | Consolidated list of financial sanctions targets | [gov.uk/ofsi](https://www.gov.uk/government/organisations/office-of-financial-sanctions-implementation) |
| **Sanctions packages** | Curated from EU Council, US Treasury OFAC, and UK Government announcements | Various official sources |
| **Wikipedia** | Pre-invasion order of battle, force groupings, and buildup timeline | [en.wikipedia.org](https://en.wikipedia.org/wiki/Order_of_battle_for_the_2022_Russian_invasion_of_Ukraine) |
| **CSIS** | Invasion axis analysis and satellite imagery assessment | [csis.org](https://www.csis.org/analysis/russias-possible-invasion-ukraine) |
| **CARTO** | Dark Matter basemap tiles | [carto.com](https://carto.com/basemaps) |
| **GADM / Natural Earth** | Administrative boundaries (GADM 4.1) and country outlines ([`datasets/geo-countries`](https://github.com/datasets/geo-countries)) | [gadm.org](https://gadm.org) |

### Data Freshness

Live sources are fetched on demand and cached as described under [API Routes](#api-routes). A separate Cloudflare Worker cron (`workers/data-refresh`) runs every 6 hours to pre-warm caches and refresh ACLED map data, and the same warm-up runs after every production deploy. Other datasets are bundled with the app and updated by scheduled or manual jobs:

| Dataset | Cache | How it is updated |
|---------|-------|-------------------|
| MoD loss figures | 4h (current) / 24h (history) | Upstream updates daily |
| WarSpotting losses | 1–24h | Upstream updates continuously |
| Territory control (DeepState) | 12h | Upstream updates daily |
| NASA FIRMS thermal anomalies | 3h | Near-real-time |
| Electricity generation (ENTSO-E) | 6h | Hourly upstream |
| Gas transit (ENTSOG) | 12h | Daily upstream |
| Refugee/IDP data (UNHCR) | 24h | Upstream updates periodically |
| Humanitarian funding (HDX HAPI) | 24h | Upstream updates periodically |
| UK OFSI sanctions list | 24h | Upstream updates periodically |
| Bilateral aid (Kiel) | 7d | **Weekly** automated PR (`update-weekly.yml`) picks up new Kiel releases |
| GeoConfirmed events | 24h | **Weekly** automated PR (`update-weekly.yml`) appends new events |
| ACLED map events | 24h | Bundled snapshot, refreshed in KV every 6h by the cron worker |
| ACLED regional heatmap | 24h | Static HDX snapshot, updated manually (`npm run data:acled`) |
| Wikidata/ACLED key events | 24h | Manual prebuild (`scripts/prebuild-events.ts`, needs ACLED credentials) |
| Civilian casualties (OHCHR) | 7d (HTTP) | Static file, updated manually |
| VIINA territory | Static | Frozen dataset (Feb 2022 – Jul 2024) |
| Missile attacks, sanctions packages, bases, infrastructure | Static | Curated in `src/data/` |
| Pre-invasion mobilization | Static | Curated historical dataset (Mar 2021 – Feb 2022) |

### Methodology

This project does not generate original analysis. It consolidates, cross-references, and visualizes data from the sources listed above.

**Territory Control & Frontline**

Territory control is shown in two phases. From February 2022 through early July 2024, the VIINA dataset (Zhukov & Ayers, University of Michigan) provides weekly territorial control estimates derived from systematic monitoring of news reports from multiple Ukrainian and Russian outlets. The application converts VIINA's point-level observations into filled polygons using convex hull computation and Delaunay triangulation to approximate areas of control, and derives frontline geometry by walking the boundary between Russian-controlled and Ukrainian-controlled clusters. From July 2024 onward, DeepState Map provides higher-resolution daily GeoJSON polygons for both occupied territory and the frontline. The transition between sources is handled automatically based on the selected timeline date.

**Russian Equipment Losses**

Daily aggregate loss figures (personnel, tanks, armored vehicles, artillery, etc.) come from the Ukrainian Ministry of Defence's official reports. These are official claims and may differ from independently verified counts. Individual geolocated equipment losses are sourced from WarSpotting, which catalogs visually confirmed losses from open-source imagery; its counts are typically 30–50% of official figures. Each loss is categorized by type and status (destroyed, damaged, captured, abandoned) and mapped to its confirmed location.

**Ukrainian Losses**

Ukraine does not regularly publish military casualty figures. The panel shows Mediazona/BBC News Russian Service confirmed-by-name counts (a conservative minimum) alongside dated public statements and assessments — from the Ukrainian President, the European Commission, the Norwegian Chief of Defence, US and UK intelligence, and press analyses. Each figure is attributed to its source, and the panel explains why estimates diverge.

**Civilian Casualties & Humanitarian Data**

Civilian casualty figures come from the UN Office of the High Commissioner for Human Rights (OHCHR), which publishes verified reports. Refugee and internally displaced persons statistics come from UNHCR. Humanitarian funding data — including the UN Flash Appeal and Refugee Response Plan — comes from OCHA via the Humanitarian Data Exchange (HDX). All figures are presented as reported by these organizations.

**Bilateral Aid & International Support**

Military, financial, and humanitarian aid commitments are sourced from the Kiel Institute for the World Economy's Ukraine Support Tracker, which covers committed and disbursed aid from 40+ donor countries. The International Support panel combines Kiel figures with government sources to classify country alignment and support types.

**Conflict Events**

Battle locations, civilian targeting events, and protests come from the Armed Conflict Location & Event Data Project (ACLED). Map events are filtered to those with 5+ fatalities. ACLED's free tier has a roughly 12-month recency restriction, so GeoConfirmed's OSINT-verified events fill the most recent period on the timeline. Named events in the timeline and sidebar combine Wikidata SPARQL results, ACLED major clashes, curated missile attacks, and editorial additions for political and diplomatic milestones.

**Energy Infrastructure**

The Energy panel combines ENTSO-E electricity generation data with a curated dataset of Ukrainian power plants and their wartime damage status. Historical energy snapshots are computed by tracking known strike dates against each facility. Gas pipeline status is derived from ENTSOG flow data and curated records of the Russia–Ukraine transit shutdown (January 2025) and TurkStream operations.

**Infrastructure Status**

Critical infrastructure — dams, bridges, ports, nuclear plants, and thermal power plants — is tracked using a curated dataset with timestamped status changes. Each item's status is computed relative to the selected timeline date. Nuclear plant data is cross-referenced with IAEA monitoring reports.

**Air Defense Performance**

Missile and drone attack data is curated from Ukrainian Air Force command reports, tracking interception rates by weapon type (cruise missiles, ballistic missiles, Shahed drones, guided bombs). Each major attack wave is logged with totals launched and intercepted.

**Sanctions**

Sanctions packages are curated from EU Council regulations, US Treasury OFAC designations, and UK Government announcements. The timeline tracks when each package was adopted and which restrictions it imposed. The sanctions API additionally merges the UK OFSI consolidated list.

**Thermal Anomalies**

Near-real-time fire and explosion detections come from NASA's Fire Information for Resource Management System (FIRMS) using the VIIRS instrument. Detections are filtered to the conflict zone and displayed as potential fire/strike indicators.

**Strategic Asset Positions**

Nuclear plants, dams, bridges, ports, NATO bases, Belarus positions, and Ukrainian and Russian bases come from curated geospatial datasets based on publicly reported information.

**Pre-Invasion Mobilization**

The buildup layer visualizes the Russian military mobilization that preceded the full-scale invasion (March 2021 – February 2022). Since no single structured source exists for this period, force grouping locations, troop estimates, battalion tactical group (BTG) counts, and equipment compositions are compiled from:

- **Wikipedia Order of Battle** — 9 force groupings with staging locations, BTG counts, and parent army units
- **Wikipedia "Prelude to the 2022 Russian invasion"** — timeline of troop movements and buildup milestones
- **CSIS "Russia's Possible Invasion of Ukraine" (Jan 2022)** — analysis of three planned invasion axes with satellite imagery locations
- **Zapad 2021 exercise documentation** — 200,000-troop joint Russia–Belarus exercise across 14 training grounds
- **IISS Military Balance 2022** — force structure and equipment inventory reference data

All troop and equipment numbers are consensus open-source estimates, not verified counts. The buildup is presented in three phases: Phase 1 (March–April 2021, initial deployment), Zapad 2021 (September 2021, joint exercise), and Phase 2 (October 2021 – February 2022, final invasion positioning).

### Data Limitations

- OHCHR civilian casualty figures are conservative minimums — actual figures are likely higher
- Ukrainian military casualty estimates vary widely between sources (Mediazona confirms ~43,000 by name; Western intelligence suggests ~100,000). No single figure is definitive
- ACLED free-tier access has a 12-month recency restriction; GeoConfirmed fills the gap with a different (OSINT) methodology
- DeepState GeoJSON is only available from July 2024; earlier territory is approximated from VIINA
- Equipment loss markers only appear where geolocation data is available (a subset of confirmed losses)
- Refugee and IDP data updates yearly — during timeline playback, the most recent available year's figures are shown
- Humanitarian funding data reflects UN-coordinated appeals only, not total global aid
- NASA FIRMS thermal detections include non-conflict sources (e.g., agricultural fires, industrial activity)
- ENTSO-E generation data reflects grid-connected output only
- Missile attack interception rates are based on Ukrainian Air Force claims, which may differ from independent assessments
- Strategic asset positions (NATO, Belarus) are based on publicly reported information and may not reflect all deployments

---

## Getting Started

### Prerequisites

- [Node.js 22](https://nodejs.org/) (pinned via `.node-version`)
- npm 10+

### Installation

```bash
git clone https://github.com/engelde/ukrainewar.git
cd ukrainewar
npm install
```

`npm install` also copies the MapLibre web worker into `public/maplibre/` (via the `prepare` script). The map will not render without it.

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the values you need. The app runs without any of them; individual features degrade as noted.

```bash
cp .env.example .env.local
```

| Variable | Needed for | Description |
|----------|-----------|-------------|
| `ACLED_EMAIL` / `ACLED_PASSWORD` | ACLED refresh, battle enrichment, `prebuild-events.ts`, `cache:warm` | ACLED account credentials — [register here](https://acleddata.com/user/register). Without them the bundled ACLED snapshot is served |
| `NASA_FIRMS_KEY` | Thermal layer | NASA FIRMS MAP_KEY — [request one here](https://firms.modaps.eosdis.nasa.gov/api/map_key/). The fallback `DEMO_KEY` rarely returns data |
| `ENTSOE_TOKEN` | Energy panel | ENTSO-E Transparency Platform API token |
| `CACHE_REFRESH_SECRET` | `/api/cache/*` (production) | Shared bearer token for the cache maintenance routes, used by the cron worker and deploy workflow |
| `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ZONE_ID` | `/api/cache/purge` (production) | Cloudflare token and zone for CDN purges |
| `CF_WEB_ANALYTICS_TOKEN` | Analytics (production) | Cloudflare Web Analytics beacon token, read at build time |

### Development

The app reads a few generated files that are not committed (`public/data/alliance.json`, `public/data/territory-dates.json`, and `public/data/viina/snapshots/`). Generate them once (requires network access), then start the dev server:

```bash
npm run data:prebuild
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the development server (Turbopack) |
| `npm run build` | Run `data:prebuild`, then a production build (webpack) |
| `npm run start` | Serve the production build locally |
| `npm run lint` | Check code with Biome |
| `npm run lint:fix` | Apply Biome fixes |
| `npm run format` | Format code with Biome |
| `npm run typecheck` | TypeScript type checking |
| `npm run preview` | Build for Cloudflare Workers and preview locally |
| `npm run build:worker` | Build for Cloudflare Workers (OpenNext) |
| `npm run deploy` | Build and deploy the main worker |
| `npm run deploy:cron` | Deploy the data-refresh cron worker |
| `npm run cache:warm` | Pre-warm persistent caches (ACLED data) |
| `npm run data:prebuild` | Generate VIINA snapshots, alliance GeoJSON, and territory dates |
| `npm run data:kiel` | Download the latest Kiel Institute release into `kiel-spending.json` |
| `npm run data:validate` | Validate `kiel-spending.json` |
| `npm run data:events` | Append the latest GeoConfirmed events to `events.json` |
| `npm run data:acled` | Rebuild the ACLED regional heatmap from HDX |
| `npm run data:viina` | Download and reprocess VIINA control data |
| `npm run data:update` | Run `data:kiel`, `data:acled`, and `data:viina` |

---

## Deployment

The application runs on [Cloudflare Workers](https://workers.cloudflare.com) using [OpenNext for Cloudflare](https://opennext.js.org/cloudflare). Production deploys happen automatically on every push to `main` (see [CI/CD & Automation](#cicd--automation)); the steps below are for a first-time setup or a fork.

### Cloudflare KV Setup

Create a KV namespace for the persistent cache layer:

```bash
npx wrangler kv namespace create CACHE
```

Copy the returned namespace ID into `wrangler.jsonc`:

```jsonc
"kv_namespaces": [
  {
    "binding": "CACHE",
    "id": "<your-kv-namespace-id>"
  }
]
```

Forks should also update the custom-domain `routes` in `wrangler.jsonc` and `APP_URL` in `workers/data-refresh/wrangler.toml`.

### Secrets

Set runtime secrets on the main worker:

```bash
npx wrangler secret put ACLED_EMAIL
npx wrangler secret put ACLED_PASSWORD
npx wrangler secret put NASA_FIRMS_KEY
npx wrangler secret put ENTSOE_TOKEN
npx wrangler secret put CACHE_REFRESH_SECRET
npx wrangler secret put CLOUDFLARE_API_TOKEN
npx wrangler secret put CLOUDFLARE_ZONE_ID
```

The cron worker needs the same `CACHE_REFRESH_SECRET`:

```bash
npx wrangler secret put CACHE_REFRESH_SECRET --config workers/data-refresh/wrangler.toml
```

### Deploy

```bash
npm run deploy        # build and deploy the main worker
npm run deploy:cron   # deploy the data-refresh cron worker (every 6 hours)
```

### CI/CD & Automation

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `ci.yml` | Pull requests | Lint, typecheck, and build |
| `deploy.yml` | Push to `main` | Runs CI, then deploys the main worker and the cron worker |
| `warm-cache.yml` | After a successful deploy | Warms API caches, refreshes ACLED and FIRMS data, and purges the CDN |
| `update-weekly.yml` | Mondays 06:00 UTC | Pulls the latest Kiel release and GeoConfirmed events and opens a data PR |
| `release-please.yml` | Push to `main` | Maintains the release PR, changelog, and GitHub releases |

Dependabot opens weekly PRs for npm dependencies (grouped into production and development) and GitHub Actions.

The workflows expect these repository settings: secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and `CACHE_REFRESH_SECRET`, and the variable `CF_WEB_ANALYTICS_TOKEN`.

---

## Contributing

Contributions are welcome. Please note:

1. This project uses **conventional commits**, enforced by commitlint
2. Staged files are checked by **Biome** in a pre-commit hook (run `npm run lint:fix` to apply fixes)
3. PRs must pass CI checks (lint, typecheck, build)

```bash
# Example commit
git commit -m "feat: add population displacement chart"

# Commit types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
```

`feat` and `fix` commits on `main` trigger a new release via Release Please.

---

## Attribution

**Created and maintained by [David Engel](https://github.com/engelde)**

This is an independent, open-source research project. It is not affiliated with, endorsed by, or funded by any government, military organization, or news outlet.

This project relies on publicly available data from the sources listed above. Each data source retains its own licensing terms. The ACLED dataset is used under [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/). Kiel Institute data is from the publicly available Ukraine Support Tracker. UNHCR and OCHA data are provided through their respective open data portals. NASA FIRMS data is freely available under NASA's open data policy. ENTSO-E and ENTSOG data are accessed through their public Transparency Platforms.

If you use this project in academic work, please cite:

```
Engel, D. (2026). Russo-Ukrainian War Tracker [Web application].
https://ukrainewar.app. Source code: https://github.com/engelde/ukrainewar
```

---

## License

This project is licensed under the **GNU Affero General Public License v3.0 or later** (AGPL-3.0-or-later).

This means you are free to:
- **Use** — run the application for any purpose
- **Study** — read and learn from the source code
- **Modify** — adapt and build upon this work
- **Share** — distribute copies

Under the following conditions:
- **Source disclosure** — if you run a modified version as a network service, you must offer its users the corresponding source code
- **Same license** — derivative works must be licensed under the AGPL
- **Notices** — you must keep existing copyright and license notices intact

See [LICENSE.txt](LICENSE.txt) for the full license text.

---

<div align="center">

**[ukrainewar.app](https://ukrainewar.app)** · Built with data, designed for understanding.

</div>
