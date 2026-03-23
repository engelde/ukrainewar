<div align="center">

<img src="public/icon.png" alt="Russo-Ukrainian War Tracker" width="80" />

# Russo-Ukrainian War Tracker

### [ukrainewar.app](https://ukrainewar.app)

**An immersive, real-time data visualization platform tracking the Russo-Ukrainian war through interactive maps, timelines, and comprehensive conflict data.**

[![CI](https://github.com/engelde/ukrainewar/actions/workflows/ci.yml/badge.svg)](https://github.com/engelde/ukrainewar/actions/workflows/ci.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)

---

*Built to inform, not to sensationalize. This project aims to provide accessible, data-driven insight into the human and material costs of the conflict.*

</div>

---

## Overview

The Russo-Ukrainian War Tracker is a dark-themed, map-centric web application that consolidates data from 12+ authoritative sources into a single interactive experience. Users can explore territory control changes, equipment losses, casualty statistics, humanitarian impact, bilateral aid, energy infrastructure status, air defense performance, and strategic asset monitoring — all synchronized to a central timeline spanning the full duration of the war.

The entire interface is built around an explorable map rendered in muted dark tones, with data panels, counters, and visualizations layered on top. Every element is designed to put the data at the center of the experience.

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
- **Nuclear power plants** — 5 Ukrainian NPPs with operational status indicators
- **Critical infrastructure** — 6 dams, 4 bridges, and 9 ports
- **NATO eastern flank** — 14 bases and enhanced forward presence battlegroups
- **Belarus military positions** — 10 tracked entries near the Ukrainian border
- **Ukrainian military bases** — 18 major installations
- **Russian military bases** — 21 known positions near Ukraine
- **Energy infrastructure** — gas transit pipelines and power stations
- **Troop movement arrows** — 27 curated military operations with animated directional paths (cyan for Ukraine, orange for Russia)
- **NASA FIRMS thermal anomalies** — near-real-time satellite fire/strike detections (VIIRS)
- Custom canvas-drawn map icons for all infrastructure and military layers
- All layers independently toggleable via layer controls

### Central Timeline

- Scrubable timeline spanning **February 24, 2022 to present**
- **Playback controls** with adjustable speed (0.25x to 8x)
- **Dynamic key events** from Wikidata, ACLED, and curated editorial sources
- **Waveform visualization** showing daily Russian loss intensity
- Calendar picker for jumping to specific dates
- URL state persistence — shareable timeline positions

### Live Statistics

- **Animated counters** for Russian military losses:
  - Personnel, tanks, armored vehicles, artillery systems
  - MLRS, UAVs, air defense systems, jets, helicopters
  - Ships/boats, supply vehicles
- **Sparkline trend charts** showing recent daily trends
- Data sourced from the Ukrainian Ministry of Defence
- All statistics update dynamically during timeline playback

### Event Sidebar

- Chronological event browser with dynamic events
- Filterable by category: Battles, Territory, Political, Military, Humanitarian, Milestones
- Filterable by conflict events from ACLED data
- Click-to-navigate: selecting an event jumps the timeline and map
- Auto-tracking during timeline playback

### Bilateral Aid Panel

- **Kiel Institute Ukraine Support Tracker** data
- Total aid breakdown: Military, Financial, Humanitarian (EUR billions)
- **Top donor countries** ranked by total commitment (EU members highlighted)
- **Monthly allocation trends** with cumulative totals
- **Top 15 weapons delivered** by category

### Humanitarian Panel

- **UNHCR refugee data** — total refugees by year, top destination countries, IDPs
- **OCHA funding status** — humanitarian appeal requirements vs. actual funding
- **Civilian casualty data** — OHCHR monthly statistics by oblast
- All humanitarian data updates during timeline playback with year-based interpolation

### Equipment Loss Detail

- Click any equipment marker for detailed information
- Equipment type, model, status (destroyed/damaged/captured/abandoned)
- Date, nearest location, and coordinates
- Color-coded by status: red (destroyed), orange (damaged), green (captured), purple (abandoned)

### Energy Infrastructure Panel

- **Real-time electricity generation** data from the ENTSO-E Transparency Platform
- **Damaged capacity tracking** — pre-war vs. current generation capacity
- **Plant-level status** for thermal, nuclear, hydro, and renewable facilities
- **Gas transit monitoring** — Ukrainian pipeline transit volumes via ENTSOG
- Data updates every 6-12 hours depending on source

### Air Defense Panel

- **Missile and drone attack statistics** aggregated from Ukrainian Air Force reports
- **Interception rates** by weapon type (cruise missiles, ballistic missiles, Shaheds)
- **Attack history** — 40 curated major attack waves from February 2022 through May 2025
- Integrated into the central timeline as filterable events

### International Support Panel

- **Global alignment breakdown** — 35 pro-Ukraine and 13 pro-Russia countries with proportional bar
- **Support type badges** — Military, Financial, Humanitarian, Political, Sanctions, Troops
- **Aid totals** per country and combined
- Country details with notable contributions and descriptions
- Data sourced from Kiel Institute and open records

### Ukrainian Losses Panel

- **Casualty estimates** compiled from multiple independent sources
- **Mediazona confirmed** — verified deaths by name (conservative minimum)
- **Western intelligence** — US, UK, and EU assessment figures
- **OHCHR civilian casualties** — UN-verified minimum
- Clear disclaimers about data uncertainty and methodology differences

### URL State Management

- Timeline date, map position (lat/lng/zoom), and sidebar state persisted in URL
- Every view is shareable and bookmarkable via [nuqs](https://nuqs.47ng.com/)

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router) |
| **Language** | [TypeScript 5](https://typescriptlang.org) |
| **UI Library** | [React 19](https://react.dev) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com) |
| **Components** | [shadcn/ui](https://ui.shadcn.com) |
| **Maps** | [MapLibre GL](https://maplibre.org) |
| **Icons** | [react-icons](https://react-icons.github.io/react-icons/) (Tabler + Game Icons) |
| **URL State** | [nuqs](https://nuqs.47ng.com/) |
| **Fonts** | [DM Sans](https://fonts.google.com/specimen/DM+Sans) + [DM Mono](https://fonts.google.com/specimen/DM+Mono) |
| **Linting** | [Biome](https://biomejs.dev) |
| **Git Hooks** | [Husky](https://typicode.github.io/husky/) + [commitlint](https://commitlint.js.org/) |
| **Versioning** | [Release Please](https://github.com/googleapis/release-please) |
| **Deployment** | [Cloudflare Workers](https://workers.cloudflare.com) via [OpenNextJS](https://opennext.js.org/cloudflare) |

---

## API Routes

The application exposes the following API endpoints. All responses are cached with stale-while-refresh semantics.

| Route | Description | Cache |
|-------|-------------|-------|
| `/api/losses` | Russian equipment and personnel losses (MoD) | 1h |
| `/api/losses/recent` | Recent visually confirmed losses (WarSpotting) | 6h |
| `/api/casualties` | Civilian casualty data (OHCHR via HDX) | 4h |
| `/api/territory` | Territory control GeoJSON (DeepState) | 12h |
| `/api/events` | Key events (Wikidata SPARQL + curated) | 24h |
| `/api/acled` | Conflict events (ACLED) | 24h |
| `/api/refugees` | Refugee and IDP statistics (UNHCR) | 24h |
| `/api/humanitarian` | Funding appeal data (OCHA via HDX) | 24h |
| `/api/aid` | Bilateral aid commitments (Kiel Institute) | 7d |
| `/api/firms` | NASA FIRMS thermal anomalies (VIIRS satellite) | 3h |
| `/api/energy` | Electricity generation + plant status (ENTSO-E) | 6h |
| `/api/energy/gas` | Gas transit through Ukraine (ENTSOG) | 12h |

---

## Data Sources

This project aggregates data from the following authoritative sources. All data is accessed through publicly available APIs and datasets.

| Source | Data Provided | Link |
|--------|--------------|------|
| **WarSpotting** | Visually confirmed Russian equipment losses with geolocation | [warspotting.net](https://warspotting.net) |
| **Ukrainian Ministry of Defence** | Official daily personnel and equipment loss reports | [mil.gov.ua](https://www.mil.gov.ua) |
| **Ukrainian Air Force** | Missile and drone attack reports, interception statistics | [t.me/kaborofua](https://t.me/kpszsu) |
| **DeepState Map** | Territory control and frontline GeoJSON data | [deepstatemap.live](https://deepstatemap.live) |
| **ACLED** | Armed conflict event data — battles, civilian targeting, protests | [acleddata.com](https://acleddata.com) |
| **Wikidata** | Structured data on named events, battles, and offensives (via SPARQL) | [wikidata.org](https://www.wikidata.org) |
| **HDX / OCHA** | Humanitarian response data, civilian casualties, funding status | [data.humdata.org](https://data.humdata.org) |
| **UNHCR** | Refugee and internally displaced persons statistics | [data.unhcr.org](https://data.unhcr.org) |
| **Kiel Institute** | Ukraine Support Tracker — bilateral military, financial, and humanitarian aid | [ifw-kiel.de](https://www.ifw-kiel.de/topics/war-against-ukraine/ukraine-support-tracker/) |
| **VIINA** | Territorial control derived from news coverage (Zhukov & Ayers) | [github.com/zhukovyuri/VIINA](https://github.com/zhukovyuri/VIINA) |
| **NASA FIRMS** | Near-real-time satellite thermal anomaly detections (VIIRS) | [firms.modaps.eosdis.nasa.gov](https://firms.modaps.eosdis.nasa.gov) |
| **ENTSO-E** | European electricity generation data (Transparency Platform) | [transparency.entsoe.eu](https://transparency.entsoe.eu) |
| **ENTSOG** | European gas transit flow data (Transparency Platform) | [transparency.entsog.eu](https://transparency.entsog.eu) |

### Data Freshness

All API responses use a multi-layer persistent caching system (file-based in development, Cloudflare KV in production) with stale-while-refresh semantics. A Cloudflare Worker cron runs every 6 hours to pre-warm all caches.

| Dataset | Cache Duration | Update Frequency |
|---------|---------------|-----------------|
| Equipment stats | 1 hour | Hourly |
| Recent losses | 6 hours | Multiple times daily |
| Casualty reports | 4 hours | Daily |
| Territory control | 12 hours | Daily |
| Conflict events (ACLED) | 24 hours | Daily |
| NASA FIRMS thermal anomalies | 3 hours | Near-real-time |
| Electricity generation (ENTSO-E) | 6 hours | Hourly |
| Gas transit (ENTSOG) | 12 hours | Daily |
| Key events (Wikidata) | 24 hours | Community-edited |
| Refugee/IDP data | 24 hours | Monthly |
| Humanitarian funding | 24 hours | Monthly |
| Civilian casualties | 24 hours | Monthly (OHCHR) |
| Bilateral aid | 7 days | Monthly releases |
| VIINA territory | Weekly | Weekly snapshots |
| Missile attack dataset | Static | Curated (40 major waves) |

---

## Getting Started

### Prerequisites

- [Node.js 22+](https://nodejs.org/) (pinned via `.node-version`)
- npm 10+

### Installation

```bash
git clone https://github.com/engelde/ukrainewar.git
cd ukrainewar
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `ACLED_EMAIL` | Yes | ACLED API email — [register here](https://developer.acleddata.com/) |
| `ACLED_PASSWORD` | Yes | ACLED API password |
| `ENTSOE_TOKEN` | No | ENTSO-E Transparency Platform API token for energy data |
| `NASA_FIRMS_KEY` | No | NASA FIRMS API key for thermal anomaly detection (falls back to demo key) |
| `CACHE_REFRESH_SECRET` | Yes | Shared secret for the `/api/cache/refresh` endpoint used by the cron worker |

For Cloudflare Workers deployment, set secrets via Wrangler:

```bash
wrangler secret put ACLED_EMAIL
wrangler secret put ACLED_PASSWORD
wrangler secret put CACHE_REFRESH_SECRET
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | Run Biome linter |
| `npm run lint:fix` | Auto-fix linting issues |
| `npm run format` | Format code with Biome |
| `npm run typecheck` | TypeScript type checking |
| `npm run cache:warm` | Pre-warm persistent caches (ACLED data) |
| `npm run data:update` | Process all static data sources |
| `npm run build:worker` | Build for Cloudflare Workers |
| `npm run deploy` | Deploy to Cloudflare Workers |
| `npm run deploy:cron` | Deploy the data-refresh cron worker |

---

## Deployment

The application is deployed to [Cloudflare Workers](https://workers.cloudflare.com) using [OpenNextJS Cloudflare](https://opennext.js.org/cloudflare).

### Cloudflare KV Setup

Create a KV namespace for the persistent cache layer:

```bash
wrangler kv:namespace create "CACHE"
```

Copy the returned namespace ID and update `wrangler.jsonc`:

```jsonc
"kv_namespaces": [
  {
    "binding": "CACHE",
    "id": "<your-kv-namespace-id>"
  }
]
```

### Deploy

```bash
npm run build:worker
npm run deploy
```

A separate Cloudflare Worker handles scheduled data refresh via cron triggers (every 6 hours), pre-warming all API caches.

```bash
npm run deploy:cron
```

---

## Contributing

Contributions are welcome. Please note:

1. This project uses **conventional commits** enforced by commitlint
2. All code is linted and formatted by **Biome** (pre-commit hook)
3. PRs must pass CI checks (lint, typecheck, build)

```bash
# Example commit
git commit -m "feat: add population displacement chart"

# Commit types: feat, fix, docs, style, refactor, perf, test, build, ci, chore
```

---

## Methodology

This project aggregates, cross-references, and visualizes publicly available conflict data. It does not generate original analysis or make claims beyond what the underlying sources report.

- **Russian military losses** are displayed from the Ukrainian Ministry of Defence daily reports. These are official claims and may differ from independently verified counts. WarSpotting data provides a separate, OSINT-verified count that is typically 30–50% of official figures — both are displayed with clear source attribution.
- **Ukrainian military losses** are not officially published by Ukraine. Estimates are compiled from Mediazona/BBC confirmed-by-name investigations (conservative minimums), Western intelligence assessments (US, UK, EU), and partial official disclosures. All estimates are presented with source attribution and uncertainty disclaimers.
- **Territory control** is derived from DeepState Map's daily GeoJSON releases, with coverage from July 2024 onward. Earlier periods use VIINA territorial assessments where available.
- **Conflict events** are sourced from ACLED's geocoded event database, filtered for events with 5+ fatalities. Key events combine Wikidata SPARQL queries with curated editorial selections for political and diplomatic milestones.
- **Humanitarian data** comes from UNHCR (refugees/IDPs), OCHA (funding appeals), and OHCHR (civilian casualties). Refugee and IDP figures are available as yearly snapshots; civilian casualties are monthly.
- **Bilateral aid** data is from the Kiel Institute's Ukraine Support Tracker, which tracks committed and disbursed military, financial, and humanitarian aid from 41 donor countries.
- **Energy infrastructure** data combines ENTSO-E electricity generation figures with curated plant-level status information. Gas transit volumes are sourced from ENTSOG's Transparency Platform, filtered for Ukrainian interconnection points.
- **Thermal anomaly detections** are sourced from NASA FIRMS using the VIIRS satellite instrument. Detections are filtered to the conflict zone and displayed as potential fire/strike indicators — not all detections represent military activity.
- **Missile attack data** is compiled from Ukrainian Air Force daily reports. The dataset includes 40 curated major attack waves from February 2022 through May 2025, with weapon types, quantities launched, and interception counts.
- **Strategic asset positions** (nuclear plants, dams, bridges, ports, NATO bases, Belarus military positions, Ukrainian and Russian bases) are sourced from curated geospatial datasets and updated as conditions change.
- **International support alignment** data tracks 48 countries across both sides, with aid figures sourced from the Kiel Institute's Ukraine Support Tracker and open records.

### Data Limitations

- OHCHR civilian casualty figures are considered conservative minimums — actual figures are likely higher
- Ukrainian military casualty estimates vary widely between sources (Mediazona confirms ~43,000 by name; Western intelligence suggests ~100,000). No single figure is definitive
- ACLED free-tier access has a 12-month recency restriction; older data may be limited
- Territory GeoJSON is only available from July 2024; earlier frontline positions are approximated
- Equipment loss markers only appear where geolocation data is available (a subset of confirmed losses)
- Refugee and IDP data updates yearly, not monthly — during timeline playback, the most recent available year's figures are shown
- Humanitarian funding data reflects UN-coordinated appeals only, not total global aid
- NASA FIRMS thermal detections include non-conflict sources (e.g., agricultural fires, industrial activity); not all anomalies indicate military strikes
- ENTSO-E generation data reflects grid-connected output only and may not capture off-grid or emergency generation
- Missile attack interception rates are based on Ukrainian Air Force claims, which may differ from independent assessments
- Strategic asset positions (NATO, Belarus) are based on publicly reported information and may not reflect all deployments

---

## Attribution

**Created and maintained by [David Engel](https://github.com/engelde)**

This project relies on publicly available data from the sources listed above. Each data source retains its own licensing terms. The ACLED dataset is used under [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/). Kiel Institute data is from the publicly available Ukraine Support Tracker. UNHCR and OCHA data are provided through their respective open data portals. NASA FIRMS data is freely available under NASA's open data policy. ENTSO-E and ENTSOG data are accessed through their public Transparency Platforms.

If you use this project in academic work, please cite:

```
Engel, D. (2026). Russo-Ukrainian War Tracker [Web application].
https://ukrainewar.app. Source code: https://github.com/engelde/ukrainewar
```

---

## License

This project is licensed under the **GNU Affero General Public License v3.0** (AGPL-3.0).

This means you are free to:
- **Use** — run the application for any purpose
- **Study** — read and learn from the source code
- **Modify** — adapt and build upon this work
- **Share** — distribute copies

Under the following conditions:
- **Source disclosure** — if you deploy a modified version, you must make the source code available
- **Same license** — derivative works must be licensed under AGPL-3.0
- **Attribution** — you must give appropriate credit

See [LICENSE.txt](LICENSE.txt) for the full license text.

---

<div align="center">

**[ukrainewar.app](https://ukrainewar.app)** · Built with data, designed for understanding.

*This project is an independent effort and is not affiliated with any government or military organization.*

</div>
