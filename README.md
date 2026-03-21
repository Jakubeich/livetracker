# LiveTracker — Global Transport Monitor

Real-time aircraft, vessel, and train tracking on an interactive 2D/3D globe.

## Features

- **3D Globe & 2D Map** — d3 orthographic globe and Natural Earth projection, switchable
- **OpenSky Network integration** — Live aircraft data from OpenSky REST API (anonymous, no auth required)
- **Simulated vessels & trains** — 60 vessels on global shipping lanes, 30 trains across Europe & East Asia
- **World geometry** — Accurate land outlines loaded from [world-atlas](https://github.com/topojson/world-atlas) (Natural Earth 110m)
- **Interactive** — Pan/rotate, zoom, click entities for detail panel, search, filter by type/status
- **Dark & light theme** — Toggle between dark ops dashboard and light mode
- **Collapsible panels** — Left filter panel slides away, detail panel on right
- **Trail rendering** — Historical path visualization for selected entity

## Tech Stack

- **Next.js 14** — App Router, React Server Components
- **React 18** — Client components with hooks
- **TypeScript** — End-to-end type safety
- **d3 / d3-geo** — Map projections, SVG rendering, geographic path generation
- **Zustand** — Lightweight state management
- **Lucide React** — Icon library

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Global styles + fonts
│   ├── layout.tsx           # Root layout with metadata
│   └── page.tsx             # Main page — assembles all components
├── components/
│   ├── layout/
│   │   ├── TopBar.tsx       # Navigation bar with controls
│   │   └── BottomBar.tsx    # Legend, zoom indicator, status banner
│   ├── map/
│   │   └── MapView.tsx      # SVG globe/map with markers, trails, tooltips
│   ├── panels/
│   │   ├── LeftPanel.tsx    # Search, filters, entity list
│   │   └── DetailPanel.tsx  # Selected entity detail view
│   └── ui/
│       └── Button.tsx       # Reusable Button and Tag primitives
├── hooks/
│   ├── useOpenSky.ts        # OpenSky API fetching (15s refresh)
│   ├── useSimulation.ts     # Vessel/train movement simulation
│   ├── useWorldGeo.ts       # World-atlas TopoJSON loading
│   └── useMapInteraction.ts # Drag/zoom mouse handlers
├── lib/
│   ├── theme.ts             # Design tokens / color system
│   ├── format.ts            # Speed, altitude, time formatters + type helpers
│   ├── geo.ts               # Great-circle interpolation, point validation
│   ├── topojson.ts          # Minimal TopoJSON → GeoJSON decoder
│   ├── opensky.ts           # OpenSky API state vector parser
│   └── generate.ts          # Simulated data generator (vessels, trains)
├── stores/
│   └── useStore.ts          # Zustand global store
└── types/
    └── index.ts             # TypeScript type definitions
```

## OpenSky Network API

Aircraft data comes from the [OpenSky Network REST API](https://openskynetwork.github.io/opensky-api/rest.html):

- **Endpoint:** `GET https://opensky-network.org/api/states/all`
- **Rate limit:** 400 credits/day (anonymous), 4000/day (authenticated)
- **Data:** ICAO24, callsign, country, lat/lon, altitude, velocity, heading, vertical rate, on-ground status
- **Update interval:** Every 15 seconds in this app (API resolution is 10s for anonymous)

> **Note:** The OpenSky API may be blocked by browser CORS policies when called directly from the frontend. In production, proxy the API through your backend. The app gracefully falls back to simulated data if the API is unreachable.

## Data Sources & Limitations

| Source | Type | Status | Cost |
|--------|------|--------|------|
| OpenSky Network | Aircraft | Live API | Free (rate limited) |
| Simulated | Vessels | Generated routes | Free |
| Simulated | Trains | Generated routes | Free |

For real vessel data, integrate [AISHub](https://www.aishub.net/) or [MarineTraffic API](https://www.marinetraffic.com/en/ais-api-services) (paid).
For real train data, integrate [GTFS-RT](https://gtfs.org/realtime/) feeds from transit agencies (free, per-agency).

## License

MIT
