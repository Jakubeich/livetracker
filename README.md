# SatTracker — Real-Time 3D Satellite Tracker

Real-time tracking of thousands of satellites orbiting Earth on an interactive 3D globe with realistic lighting, seasonal effects, and detailed orbital data.

## Features

- **3D Globe** — Three.js rendered Earth with NASA Blue Marble textures (5400×2700), cloud layer, and atmospheric glow
- **Real satellite data** — Live TLE data from CelesTrak for ~4000+ satellites across 9 groups (Starlink, GPS, ISS, military, weather, and more)
- **SGP4/SDP4 propagation** — Accurate orbital position computation using satellite.js, updated every 3 seconds
- **Day/night cycle** — Custom GLSL shader with real-time sun position, smooth terminator, and city lights on the dark side
- **Seasonal effects** — Dynamic snow cover, ice cap expansion, and vegetation changes based on current date and solar declination
- **3D satellite models** — Detailed models with solar panels and antennas for selected/hovered satellites, instanced rendering for thousands of others
- **Orbital visualization** — Full orbit path rendering with gradient fade, ground footprint circle, and ground-to-satellite link
- **Camera fly-to** — Smooth animated camera transition when selecting a satellite
- **Interactive** — Click/hover satellites, search by name or NORAD ID, filter by group
- **Detail panel** — Position (lat/lon/alt), velocity, orbital period, orbit type (LEO/MEO/GEO/HEO), TLE data, N2YO link
- **Dark & light theme** — Toggle between dark ops dashboard and light mode

## Tech Stack

- **Next.js 14** — App Router with API route as server-side proxy for CelesTrak
- **React 18** — Client components with hooks
- **TypeScript** — End-to-end type safety
- **Three.js** — 3D globe rendering, InstancedMesh for performance, custom GLSL shaders
- **satellite.js** — SGP4/SDP4 orbital propagation from TLE data
- **Zustand** — Lightweight state management
- **Lucide React** — Icon library

## Getting Started

```bash
# Install dependencies
npm install --legacy-peer-deps

# Run development server
npm run dev

# Open http://localhost:3000
```

## Project Structure

```
src/
├── app/
│   ├── api/satellites/
│   │   └── route.ts           # Server-side proxy for CelesTrak TLE API
│   ├── globals.css            # Global styles + fonts
│   ├── layout.tsx             # Root layout with metadata
│   └── page.tsx               # Main page — assembles all components
├── components/
│   ├── globe/
│   │   └── GlobeView.tsx      # Three.js 3D globe, satellite rendering, shaders
│   ├── layout/
│   │   ├── TopBar.tsx         # Group filter toggles, orbit toggle, controls
│   │   └── BottomBar.tsx      # Legend with group colors, satellite count by group
│   ├── panels/
│   │   ├── LeftPanel.tsx      # Search, satellite list (sortable, filterable)
│   │   └── DetailPanel.tsx    # Selected satellite detail view
│   └── ui/
│       └── Button.tsx         # Reusable Button primitive
├── hooks/
│   └── useSatellites.ts       # TLE fetching (30min refresh), SGP4 propagation (3s)
├── lib/
│   ├── satellite.ts           # TLE parser, SGP4 propagation, orbit computation
│   ├── theme.ts               # Design tokens / color system per satellite group
│   └── format.ts              # Time formatter
├── stores/
│   └── useStore.ts            # Zustand global store
├── types/
│   └── index.ts               # TypeScript type definitions
public/
└── textures/
    ├── earth-day-8k.jpg       # NASA Blue Marble day texture
    ├── earth-night-5k.jpg     # City lights at night
    ├── earth-clouds-4k.jpg    # Cloud cover overlay
    └── earth-topo-8k.jpg      # Topography + bathymetry
```

## Satellite Data

All satellite data comes from [CelesTrak](https://celestrak.org/), fetched as TLE (Two-Line Element) sets and propagated client-side using SGP4.

| Group | Examples | Source |
|-------|----------|--------|
| Stations | ISS, Tiangong | CelesTrak `stations` |
| Starlink | SpaceX Starlink constellation | CelesTrak `starlink` |
| OneWeb | OneWeb constellation | CelesTrak `oneweb` |
| GNSS | GPS, GLONASS, Galileo, BeiDou | CelesTrak `gps-ops`, `glo-ops`, `galileo`, `beidou` |
| Comms | Iridium, Intelsat, SES, GEO sats | CelesTrak `geo`, `intelsat`, `iridium-NEXT`, ... |
| Weather | NOAA, GOES, Meteosat | CelesTrak `weather`, `noaa`, `goes` |
| Science | Scientific & geodetic satellites | CelesTrak `science`, `geodetic` |
| Military | Military & radar satellites | CelesTrak `military`, `radar` |
| Other | CubeSats, Planet, Spire | CelesTrak `cubesat`, `planet`, `spire` |

## Performance

- **InstancedMesh** — One draw call per satellite group instead of individual meshes for each satellite
- **Ref-based state** — Satellite data stored in React refs to avoid triggering re-renders on position updates
- **Conditional rebuilds** — Full scene rebuild only on selection/group changes; position-only matrix updates every 3 seconds
- **Throttled hover** — Raycasting checked every 3rd animation frame
- **DevicePixelRatio cap** — Capped at 2× for consistent performance

## License

MIT
