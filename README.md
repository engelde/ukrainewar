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

The Russo-Ukrainian War Tracker is a dark-themed, map-centric web application that consolidates data from 8+ authoritative sources into a single interactive experience. Users can explore territory control changes, equipment losses, casualty statistics, humanitarian impact, and bilateral aid — all synchronized to a central timeline spanning the full duration of the war.

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
- All layers independently toggleable via layer controls

### Central Timeline

- Scrubable timeline spanning **February 24, 2022 to present**
- **Playback controls** with adjustable speed (0.25x to 4x)
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

## Data Sources

This project aggregates data from the following authoritative sources. All data is accessed through publicly available APIs and datasets.

| Source | Data Provided | Link |
|--------|--------------|------|
| **WarSpotting** | Visually confirmed Russian equipment losses with geolocation | [warspotting.net](https://warspotting.net) |
| **Ukrainian Ministry of Defence** | Official daily personnel and equipment loss reports | [mil.gov.ua](https://www.mil.gov.ua) |
| **DeepState Map** | Territory control and frontline GeoJSON data | [deepstatemap.live](https://deepstatemap.live) |
| **ACLED** | Armed conflict event data — battles, civilian targeting, protests | [acleddata.com](https://acleddata.com) |
| **Wikidata** | Structured data on named events, battles, and offensives (via SPARQL) | [wikidata.org](https://www.wikidata.org) |
| **HDX / OCHA** | Humanitarian response data, civilian casualties, funding status | [data.humdata.org](https://data.humdata.org) |
| **UNHCR** | Refugee and internally displaced persons statistics | [data.unhcr.org](https://data.unhcr.org) |
| **Kiel Institute** | Ukraine Support Tracker — bilateral military, financial, and humanitarian aid | [ifw-kiel.de](https://www.ifw-kiel.de/topics/war-against-ukraine/ukraine-support-tracker/) |
| **VIINA** | Territorial control derived from news coverage (Zhukov & Ayers) | [github.com/zhukovyuri/VIINA](https://github.com/zhukovyuri/VIINA) |

### Data Freshness

All API responses use a multi-layer persistent caching system (file-based in development, Cloudflare KV in production) with stale-while-refresh semantics. A Cloudflare Worker cron runs every 6 hours to pre-warm all caches.

| Dataset | Cache Duration | Update Frequency |
|---------|---------------|-----------------|
| Equipment stats | 1 hour | Hourly |
| Recent losses | 6 hours | Multiple times daily |
| Casualty reports | 4 hours | Daily |
| Territory control | 12 hours | Daily |
| Conflict events (ACLED) | 24 hours | Daily |
| Key events (Wikidata) | 24 hours | Community-edited |
| Refugee/IDP data | 24 hours | Monthly |
| Humanitarian funding | 24 hours | Monthly |
| Civilian casualties | 24 hours | Monthly (OHCHR) |
| Bilateral aid | 7 days | Monthly releases |
| VIINA territory | Weekly | Weekly snapshots |

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
- **Territory control** is derived from DeepState Map's daily GeoJSON releases, with coverage from July 2024 onward. Earlier periods use VIINA territorial assessments where available.
- **Conflict events** are sourced from ACLED's geocoded event database, filtered for events with 5+ fatalities. Key events combine Wikidata SPARQL queries with curated editorial selections for political and diplomatic milestones.
- **Humanitarian data** comes from UNHCR (refugees/IDPs), OCHA (funding appeals), and OHCHR (civilian casualties). Refugee and IDP figures are available as yearly snapshots; civilian casualties are monthly.
- **Bilateral aid** data is from the Kiel Institute's Ukraine Support Tracker, which tracks committed and disbursed military, financial, and humanitarian aid from 41 donor countries.

### Data Limitations

- OHCHR civilian casualty figures are considered conservative minimums — actual figures are likely higher
- ACLED free-tier access has a 12-month recency restriction; older data may be limited
- Territory GeoJSON is only available from July 2024; earlier frontline positions are approximated
- Equipment loss markers only appear where geolocation data is available (a subset of confirmed losses)
- Refugee and IDP data updates yearly, not monthly — during timeline playback, the most recent available year's figures are shown
- Humanitarian funding data reflects UN-coordinated appeals only, not total global aid

---

## Attribution

**Created and maintained by [David Engel](https://github.com/engelde)**

This project relies on publicly available data from the sources listed above. Each data source retains its own licensing terms. The ACLED dataset is used under [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/). Kiel Institute data is from the publicly available Ukraine Support Tracker. UNHCR and OCHA data are provided through their respective open data portals.

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
