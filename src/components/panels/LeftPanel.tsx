"use client";
import { useMemo } from "react";
import { useStore } from "@/stores/useStore";
import { theme } from "@/lib/theme";
import {
  Search, X, ChevronLeft, ChevronRight,
} from "lucide-react";
import type { SatelliteRecord, SatGroup } from "@/types";

const GROUP_COLORS: Record<SatGroup, string> = {
  stations: theme.stations,
  starlink: theme.starlink,
  oneweb: theme.oneweb,
  gps: theme.gps,
  comms: theme.comms,
  weather: theme.weather,
  science: theme.science,
  military: theme.military,
  other: theme.other,
};

const GROUP_LABELS: Record<string, string> = {
  stations: "Station",
  starlink: "Starlink",
  oneweb: "OneWeb",
  gps: "GNSS",
  comms: "Comms",
  weather: "Weather",
  science: "Science",
  military: "Military",
  other: "Other",
};

export function LeftPanel() {
  const T = theme;
  const open = useStore(s => s.leftPanelOpen);
  const setLeftPanelOpen = useStore(s => s.setLeftPanelOpen);
  const satellites = useStore(s => s.satellites);
  const activeGroups = useStore(s => s.activeGroups);
  const searchQuery = useStore(s => s.searchQuery);
  const setSearchQuery = useStore(s => s.setSearchQuery);
  const selectedId = useStore(s => s.selectedId);
  const setSelectedId = useStore(s => s.setSelectedId);

  const filtered = useMemo(() => {
    let list = satellites.filter(s => activeGroups.has(s.group));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
    }
    // Sort: stations first, then by name
    list.sort((a, b) => {
      if (a.group === "stations" && b.group !== "stations") return -1;
      if (b.group === "stations" && a.group !== "stations") return 1;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [satellites, activeGroups, searchQuery]);

  return (
    <>
      <button
        onClick={() => setLeftPanelOpen(!open)}
        style={{
          position: "absolute", left: open ? 280 : 0, top: 12, width: 30, height: 40,
          background: T.bg2, border: `1px solid ${T.brd}`, borderLeft: open ? "none" : `1px solid ${T.brd}`,
          borderRadius: "0 8px 8px 0", color: T.t1, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 210, transition: "left 0.25s ease", boxShadow: "2px 0 12px rgba(0,0,0,0.3)",
        }}
      >
        {open ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 280,
        transform: open ? "translateX(0)" : "translateX(-100%)",
        background: `${T.bg1}f2`, backdropFilter: "blur(14px)",
        borderRight: `1px solid ${T.brd}`, zIndex: 200,
        transition: "transform 0.25s ease", display: "flex", flexDirection: "column",
      }}>
        {/* Search */}
        <div style={{ padding: 10, borderBottom: `1px solid ${T.brd}` }}>
          <div style={{ position: "relative" }}>
            <Search size={12} color={T.t3} style={{ position: "absolute", left: 9, top: 7 }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search satellites..."
              style={{
                width: "100%", padding: "6px 8px 6px 28px", background: T.bg2,
                border: `1px solid ${T.brd}`, borderRadius: 5, color: T.t0,
                fontSize: 11, outline: "none", boxSizing: "border-box",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{ position: "absolute", right: 6, top: 5, background: "none", border: "none", color: T.t3, cursor: "pointer" }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Satellite list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{
            padding: "4px 10px", display: "flex", justifyContent: "space-between",
            fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: T.t3,
            position: "sticky", top: 0, background: T.bg1, zIndex: 1,
            borderBottom: `1px solid ${T.brd}`,
          }}>
            <span>SATELLITES</span>
            <span>{filtered.length}</span>
          </div>
          {filtered.slice(0, 150).map(sat => (
            <SatListItem
              key={sat.id}
              sat={sat}
              selected={sat.id === selectedId}
              onClick={() => setSelectedId(sat.id)}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function SatListItem({ sat, selected, onClick }: { sat: SatelliteRecord; selected: boolean; onClick: () => void }) {
  const T = theme;
  const color = GROUP_COLORS[sat.group];

  return (
    <div
      onClick={onClick}
      style={{
        padding: "6px 10px", cursor: "pointer",
        borderBottom: `1px solid ${T.brd}`,
        background: selected ? `${color}12` : "transparent",
        borderLeft: selected ? `3px solid ${color}` : "3px solid transparent",
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = `${T.bg3}80`; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "transparent"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0, flex: 1 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
          <span style={{
            fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
            color: T.t0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{sat.name}</span>
        </div>
        <span style={{ fontSize: 8, fontFamily: "'JetBrains Mono', monospace", color, flexShrink: 0, marginLeft: 4 }}>
          {GROUP_LABELS[sat.group]}
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 2, fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: T.t3 }}>
        <span>ALT {sat.alt.toFixed(0)}km</span>
        <span>VEL {(sat.velocity * 3600).toFixed(0)}km/h</span>
      </div>
    </div>
  );
}
