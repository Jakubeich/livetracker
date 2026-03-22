import { create } from "zustand";
import type { SatelliteRecord, SatGroup, ThemeMode, Dims } from "@/types";

export interface PassPrediction {
  satId: string;
  satName: string;
  group: SatGroup;
  startTime: Date;
  peakTime: Date;
  endTime: Date;
  peakElevation: number; // degrees
  peakAzimuth: number;   // degrees
}

interface AppState {
  satellites: SatelliteRecord[];
  status: "loading" | "live" | "error";
  selectedId: string | null;
  hoveredId: string | null;
  activeGroups: Set<SatGroup>;
  searchQuery: string;
  showOrbits: boolean;
  theme: ThemeMode;
  dims: Dims;
  leftPanelOpen: boolean;

  // Time control
  timeOffset: number;  // ms offset from real time (0 = live)
  simSpeed: number;    // 1 = realtime, 2 = 2x, etc.
  paused: boolean;

  // Follow mode
  followMode: boolean;
  showStats: boolean;
  showLaunches: boolean;

  // User location for pass prediction
  userLat: number | null;
  userLon: number | null;
  showPassPanel: boolean;
  passes: PassPrediction[];

  setSatellites: (sats: SatelliteRecord[]) => void;
  setStatus: (s: "loading" | "live" | "error") => void;
  setSelectedId: (id: string | null) => void;
  setHoveredId: (id: string | null) => void;
  toggleGroup: (g: SatGroup) => void;
  setSearchQuery: (q: string) => void;
  setShowOrbits: (v: boolean) => void;
  setTheme: (t: ThemeMode) => void;
  setDims: (d: Dims) => void;
  setLeftPanelOpen: (v: boolean) => void;
  setTimeOffset: (offset: number) => void;
  setSimSpeed: (speed: number) => void;
  setPaused: (paused: boolean) => void;
  setFollowMode: (v: boolean) => void;
  setShowStats: (v: boolean) => void;
  setShowLaunches: (v: boolean) => void;
  setUserLocation: (lat: number, lon: number) => void;
  setShowPassPanel: (v: boolean) => void;
  setPasses: (p: PassPrediction[]) => void;
}

const ALL_GROUPS: SatGroup[] = ["stations", "starlink", "oneweb", "gps", "comms", "weather", "science", "military", "other"];

export const useStore = create<AppState>((set) => ({
  satellites: [],
  status: "loading",
  selectedId: null,
  hoveredId: null,
  activeGroups: new Set<SatGroup>(ALL_GROUPS),
  searchQuery: "",
  showOrbits: true,
  theme: "dark",
  dims: { w: 1200, h: 700 },
  leftPanelOpen: false,

  timeOffset: 0,
  simSpeed: 1,
  paused: false,

  followMode: false,
  showStats: false,
  showLaunches: false,

  userLat: null,
  userLon: null,
  showPassPanel: false,
  passes: [],

  setSatellites: (satellites) => set({ satellites }),
  setStatus: (status) => set({ status }),
  setSelectedId: (selectedId) => set({ selectedId }),
  setHoveredId: (hoveredId) => set({ hoveredId }),
  toggleGroup: (g) => set((s) => {
    const next = new Set(s.activeGroups);
    if (next.has(g)) next.delete(g);
    else next.add(g);
    return { activeGroups: next };
  }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setShowOrbits: (showOrbits) => set({ showOrbits }),
  setTheme: (theme) => set({ theme }),
  setDims: (dims) => set({ dims }),
  setLeftPanelOpen: (leftPanelOpen) => set({ leftPanelOpen }),
  setTimeOffset: (timeOffset) => set({ timeOffset }),
  setSimSpeed: (simSpeed) => set({ simSpeed }),
  setPaused: (paused) => set({ paused }),
  setFollowMode: (followMode) => set({ followMode }),
  setShowStats: (showStats) => set({ showStats }),
  setShowLaunches: (showLaunches) => set({ showLaunches }),
  setUserLocation: (lat, lon) => set({ userLat: lat, userLon: lon }),
  setShowPassPanel: (showPassPanel) => set({ showPassPanel }),
  setPasses: (passes) => set({ passes }),
}));
