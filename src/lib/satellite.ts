import * as satellite from "satellite.js";
import type { SatelliteRecord, SatGroup, OrbitPoint } from "@/types";

/**
 * Parse TLE text into satellite records with initial positions.
 */
export function parseTLE(tleText: string, group: SatGroup): SatelliteRecord[] {
  const lines = tleText.trim().split("\n").map(l => l.trim()).filter(Boolean);
  const sats: SatelliteRecord[] = [];

  for (let i = 0; i + 2 < lines.length; i += 3) {
    const name = lines[i];
    const tle1 = lines[i + 1];
    const tle2 = lines[i + 2];

    if (!tle1.startsWith("1 ") || !tle2.startsWith("2 ")) continue;

    try {
      const satrec = satellite.twoline2satrec(tle1, tle2);
      const noradId = tle1.substring(2, 7).trim();
      const pos = propagateAt(satrec, new Date());
      if (!pos) continue;

      sats.push({
        id: `${group}_${noradId}`,
        name: name.trim(),
        group,
        tle1,
        tle2,
        lat: pos.lat,
        lon: pos.lon,
        alt: pos.alt,
        velocity: pos.velocity,
      });
    } catch {
      // Skip invalid TLE
    }
  }

  return sats;
}

/**
 * Propagate a single satellite to a given time.
 */
function propagateAt(
  satrec: satellite.SatRec,
  date: Date
): { lat: number; lon: number; alt: number; velocity: number } | null {
  const posVel = satellite.propagate(satrec, date);
  if (!posVel || !posVel.position || typeof posVel.position === "boolean") return null;

  const gmst = satellite.gstime(date);
  const geo = satellite.eciToGeodetic(posVel.position as satellite.EciVec3<number>, gmst);

  const lat = satellite.degreesLat(geo.latitude);
  const lon = satellite.degreesLong(geo.longitude);
  const alt = geo.height; // km

  let velocity = 0;
  if (posVel.velocity && typeof posVel.velocity !== "boolean") {
    const v = posVel.velocity as satellite.EciVec3<number>;
    velocity = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  }

  return { lat, lon, alt, velocity };
}

/**
 * Update positions for all satellites at current time.
 */
export function updatePositions(sats: SatelliteRecord[]): SatelliteRecord[] {
  const now = new Date();
  return sats.map(sat => {
    try {
      const satrec = satellite.twoline2satrec(sat.tle1, sat.tle2);
      const pos = propagateAt(satrec, now);
      if (!pos) return sat;
      return { ...sat, lat: pos.lat, lon: pos.lon, alt: pos.alt, velocity: pos.velocity };
    } catch {
      return sat;
    }
  });
}

/**
 * Compute orbit path for a satellite (one full orbit, ~100 min for LEO).
 * Returns 3D coordinates for Three.js rendering.
 */
export function computeOrbit(sat: SatelliteRecord, numPoints: number = 120): OrbitPoint[] {
  try {
    const satrec = satellite.twoline2satrec(sat.tle1, sat.tle2);
    const now = new Date();
    const points: OrbitPoint[] = [];

    // Estimate orbital period from mean motion (rev/day in TLE line 2)
    const meanMotion = parseFloat(sat.tle2.substring(52, 63));
    const periodMin = meanMotion > 0 ? (24 * 60) / meanMotion : 90;

    for (let i = 0; i < numPoints; i++) {
      const t = new Date(now.getTime() + (i / numPoints) * periodMin * 60000);
      const posVel = satellite.propagate(satrec, t);
      if (!posVel || !posVel.position || typeof posVel.position === "boolean") continue;

      const gmst = satellite.gstime(t);
      const geo = satellite.eciToGeodetic(posVel.position as satellite.EciVec3<number>, gmst);
      const lat = satellite.degreesLat(geo.latitude);
      const lon = satellite.degreesLong(geo.longitude);
      const alt = geo.height;

      // Convert to 3D coordinates (sphere radius = 1, plus altitude)
      const R = 1 + alt / 6371;
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);

      points.push({
        x: -R * Math.sin(phi) * Math.cos(theta),
        y: R * Math.cos(phi),
        z: R * Math.sin(phi) * Math.sin(theta),
        lat, lon, alt,
      });
    }

    return points;
  } catch {
    return [];
  }
}

/**
 * Convert lat/lon/alt to 3D position on the globe.
 * Globe radius = 1, altitude in km, Earth radius = 6371 km.
 */
export function latLonToVec3(lat: number, lon: number, alt: number = 0): [number, number, number] {
  const R = 1 + alt / 6371;
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return [
    -R * Math.sin(phi) * Math.cos(theta),
    R * Math.cos(phi),
    R * Math.sin(phi) * Math.sin(theta),
  ];
}
