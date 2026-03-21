import { create } from "zustand";
import type { SatelliteRecord, SatGroup, ThemeMode, Dims } from "@/types";

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
}));
