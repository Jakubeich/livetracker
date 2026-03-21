"use client";
import { useMemo } from "react";
import { useStore } from "@/stores/useStore";
import { theme } from "@/lib/theme";
import {
  Search, X, ChevronLeft, ChevronRight, Satellite,
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
    list.sort((a, b) => {
      if (a.group === "stations" && b.group !== "stations") return -1;
      if (b.group === "stations" && a.group !== "stations") return 1;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [satellites, activeGroups, searchQuery]);

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setLeftPanelOpen(!open)}
        style={{
          position: "absolute", left: open ? 320 : 0, top: 16, width: 36, height: 48,
          background: `${T.bg2}dd`, backdropFilter: "blur(16px)",
          border: `1px solid ${T.brd}`, borderLeft: open ? "none" : `1px solid ${T.brd}`,
          borderRadius: "0 12px 12px 0", color: T.t1, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 210, transition: "left 0.3s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: "4px 0 20px rgba(0,0,0,0.3)",
        }}
      >
        {open ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>

      {/* Panel */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 320,
        transform: open ? "translateX(0)" : "translateX(-100%)",
        background: `${T.bg1}f0`, backdropFilter: "blur(24px)",
        borderRight: `1px solid ${T.brd}`, zIndex: 200,
        transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        display: "flex", flexDirection: "column",
        boxShadow: open ? "8px 0 40px rgba(0,0,0,0.4)" : "none",
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 16px 12px",
          borderBottom: `1px solid ${T.brd}`,
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
          }}>
            <Satellite size={16} color={T.accent} />
            <span style={{
              fontSize: 14, fontWeight: 700, color: T.t0, letterSpacing: -0.3,
            }}>
              Satellites
            </span>
            <span style={{
              marginLeft: "auto",
              fontSize: 11, fontWeight: 600, color: T.accent,
              fontFamily: "'JetBrains Mono', monospace",
              background: `${T.accent}15`,
              padding: "3px 10px", borderRadius: 8,
            }}>
              {filtered.length}
            </span>
          </div>

          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search size={14} color={T.t3} style={{ position: "absolute", left: 12, top: 10 }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name or NORAD ID..."
              style={{
                width: "100%", padding: "9px 12px 9px 36px", background: T.bg2,
                border: `1px solid ${T.brd}`, borderRadius: 10, color: T.t0,
                fontSize: 13, outline: "none", boxSizing: "border-box",
                fontFamily: "'Inter', sans-serif",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute", right: 8, top: 7,
                  background: `${T.bg3}`, border: "none", color: T.t3,
                  cursor: "pointer", borderRadius: 6, padding: "2px 4px",
                  display: "flex", alignItems: "center",
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Satellite list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.slice(0, 200).map(sat => (
            <SatListItem
              key={sat.id}
              sat={sat}
              selected={sat.id === selectedId}
              onClick={() => setSelectedId(sat.id)}
            />
          ))}
          {filtered.length === 0 && (
            <div style={{
              padding: 24, textAlign: "center", color: T.t3,
              fontSize: 13,
            }}>
              No satellites found
            </div>
          )}
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
        padding: "10px 16px", cursor: "pointer",
        borderBottom: `1px solid ${T.brd}40`,
        background: selected ? `${color}12` : "transparent",
        borderLeft: selected ? `3px solid ${color}` : "3px solid transparent",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = `${T.bg3}60`; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "transparent"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0,
            boxShadow: `0 0 6px ${color}50`,
          }} />
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: T.t0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{sat.name}</span>
        </div>
        <span style={{
          fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color,
          flexShrink: 0, marginLeft: 8, fontWeight: 600,
          background: `${color}10`, padding: "2px 8px", borderRadius: 6,
        }}>
          {GROUP_LABELS[sat.group]}
        </span>
      </div>
      <div style={{
        display: "flex", gap: 12, marginTop: 4,
        fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: T.t3,
      }}>
        <span>ALT {sat.alt.toFixed(0)} km</span>
        <span>VEL {(sat.velocity * 3600).toFixed(0)} km/h</span>
      </div>
    </div>
  );
}
