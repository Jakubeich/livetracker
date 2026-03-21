export const theme = {
  bg0: "#05080f",
  bg1: "#0a1020",
  bg2: "#111a2e",
  bg3: "#162040",
  brd: "#1a2540",
  brd1: "#243055",
  t0: "#f0f4fc",
  t1: "#c8d0e8",
  t2: "#8892b0",
  t3: "#5a6480",
  // Satellite group colors
  stations: "#fbbf24",
  starlink: "#60a5fa",
  oneweb: "#38bdf8",
  gps: "#34d399",
  comms: "#fb923c",
  weather: "#f97316",
  science: "#c084fc",
  military: "#ef4444",
  other: "#8892b0",
  active: "#8892b0",
  ok: "#22c55e",
  warn: "#eab308",
  err: "#ef4444",
} as const;

export type Theme = typeof theme;
