"use client";
import { useEffect, useRef, useCallback } from "react";
import { useStore } from "@/stores/useStore";
import { parseTLE, updatePositionsAt } from "@/lib/satellite";
import type { SatelliteRecord, SatGroup } from "@/types";

const GROUPS_TO_FETCH: SatGroup[] = [
  "stations", "starlink", "oneweb", "gps", "comms", "weather", "science", "military", "other"
];

// Max satellites per group (total will be ~4000-5000 for good performance)
const GROUP_LIMITS: Partial<Record<SatGroup, number>> = {
  starlink: 1500,
  oneweb: 600,
  comms: 800,
  other: 500,
};

export function useSatellites() {
  const setSatellites = useStore(s => s.setSatellites);
  const setStatus = useStore(s => s.setStatus);
  const propagateRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const satsRef = useRef<SatelliteRecord[]>([]);

  const fetchAll = useCallback(async () => {
    setStatus("loading");
    try {
      // Fetch groups in batches of 3 to avoid too many parallel requests
      const allSats: SatelliteRecord[] = [];
      const batchSize = 3;

      for (let i = 0; i < GROUPS_TO_FETCH.length; i += batchSize) {
        const batch = GROUPS_TO_FETCH.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(async (group) => {
            const res = await fetch(`/api/satellites?group=${group}`);
            if (!res.ok) return [];
            const data = await res.json();
            if (!data.tle) return [];
            const parsed = parseTLE(data.tle, group);
            const limit = GROUP_LIMITS[group];
            return limit ? parsed.slice(0, limit) : parsed;
          })
        );

        for (const r of results) {
          if (r.status === "fulfilled") allSats.push(...r.value);
        }

        // Update incrementally so user sees satellites appearing
        if (allSats.length > 0) {
          satsRef.current = [...allSats];
          setSatellites(satsRef.current);
          if (i === 0) setStatus("live");
        }
      }

      // Deduplicate by NORAD ID (some sats appear in multiple groups)
      const seen = new Set<string>();
      const deduped: SatelliteRecord[] = [];
      for (const sat of allSats) {
        const noradId = sat.tle1.substring(2, 7).trim();
        if (!seen.has(noradId)) {
          seen.add(noradId);
          deduped.push(sat);
        }
      }

      satsRef.current = deduped;
      setSatellites(deduped);
      setStatus(deduped.length > 0 ? "live" : "error");
    } catch {
      setStatus("error");
    }
  }, [setSatellites, setStatus]);

  // Fetch TLE data on mount
  useEffect(() => {
    fetchAll();
    const tleInterval = setInterval(fetchAll, 30 * 60 * 1000);
    return () => clearInterval(tleInterval);
  }, [fetchAll]);

  // Propagate positions every 3 seconds, using timeOffset and simSpeed
  useEffect(() => {
    propagateRef.current = setInterval(() => {
      if (satsRef.current.length === 0) return;
      const { timeOffset, paused, simSpeed } = useStore.getState();
      if (paused) return;

      // Advance offset by 3s * simSpeed for non-realtime
      if (simSpeed !== 1 || timeOffset !== 0) {
        const newOffset = timeOffset + 3000 * simSpeed;
        useStore.getState().setTimeOffset(newOffset);
      }

      const simTime = new Date(Date.now() + useStore.getState().timeOffset);
      const updated = updatePositionsAt(satsRef.current, simTime);
      satsRef.current = updated;
      setSatellites(updated);
    }, 3000);

    return () => {
      if (propagateRef.current) clearInterval(propagateRef.current);
    };
  }, [setSatellites]);

  return { refresh: fetchAll };
}
