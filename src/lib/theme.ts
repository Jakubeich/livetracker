export const theme = {
  bg0: "#030712",
  bg1: "#0a1124",
  bg2: "#111d35",
  bg3: "#182848",
  brd: "#1e3050",
  brd1: "#2a4070",
  t0: "#f1f5fd",
  t1: "#c8d6f0",
  t2: "#8899b8",
  t3: "#5a6a88",
  // Satellite group colors — vibrant
  stations: "#facc15",
  starlink: "#60a5fa",
  oneweb: "#22d3ee",
  gps: "#34d399",
  comms: "#fb923c",
  weather: "#f97316",
  science: "#a78bfa",
  military: "#f87171",
  other: "#94a3b8",
  active: "#94a3b8",
  ok: "#22c55e",
  warn: "#eab308",
  err: "#ef4444",
  accent: "#818cf8",
} as const;

export type Theme = typeof theme;
