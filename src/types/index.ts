export interface SatelliteRecord {
  id: string;
  name: string;
  group: SatGroup;
  tle1: string;
  tle2: string;
  lat: number;
  lon: number;
  alt: number;        // km
  velocity: number;   // km/s
}

export type SatGroup =
  | "stations"
  | "starlink"
  | "oneweb"
  | "gps"
  | "comms"
  | "weather"
  | "science"
  | "military"
  | "other";

export interface OrbitPoint {
  x: number;
  y: number;
  z: number;
  lat: number;
  lon: number;
  alt: number;
}

export type ThemeMode = "dark" | "light";

export interface Dims {
  w: number;
  h: number;
}
