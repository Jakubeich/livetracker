"use client";
import { useStore } from "@/stores/useStore";
import { theme } from "@/lib/theme";
import { Button } from "@/components/ui/Button";
import {
  RefreshCw, Orbit, Satellite,
} from "lucide-react";
import type { SatGroup } from "@/types";

const GROUP_META: { key: SatGroup; label: string; color: string }[] = [
  { key: "stations", label: "Stations", color: theme.stations },
  { key: "starlink", label: "Starlink", color: theme.starlink },
  { key: "oneweb", label: "OneWeb", color: theme.oneweb },
  { key: "gps", label: "GNSS", color: theme.gps },
  { key: "comms", label: "Comms", color: theme.comms },
  { key: "weather", label: "Weather", color: theme.weather },
  { key: "science", label: "Science", color: theme.science },
  { key: "military", label: "Military", color: theme.military },
  { key: "other", label: "Other", color: theme.other },
];

interface TopBarProps {
  onRefresh: () => void;
}

export function TopBar({ onRefresh }: TopBarProps) {
  const T = theme;
  const status = useStore(s => s.status);
  const satellites = useStore(s => s.satellites);
  const activeGroups = useStore(s => s.activeGroups);
  const toggleGroup = useStore(s => s.toggleGroup);
  const showOrbits = useStore(s => s.showOrbits);
  const setShowOrbits = useStore(s => s.setShowOrbits);

  return (
    <div style={{
      height: 56, background: `${T.bg1}ee`, backdropFilter: "blur(20px)",
      borderBottom: `1px solid ${T.brd}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 20px", zIndex: 300, flexShrink: 0,
    }}>
      {/* Left section */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #818cf8, #60a5fa)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 20px rgba(129,140,248,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}>
            <Satellite size={18} color="#fff" />
          </div>
          <div>
            <div style={{
              fontSize: 16, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.1,
              color: T.t0,
              background: "linear-gradient(135deg, #f1f5fd, #818cf8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              SatTracker
            </div>
            <div style={{
              fontSize: 9, color: T.t3, letterSpacing: 2.5, textTransform: "uppercase",
              fontFamily: "'JetBrains Mono', monospace", fontWeight: 500,
            }}>
              REAL-TIME 3D
            </div>
          </div>
        </div>

        <div style={{ width: 1, height: 28, background: `${T.brd}80` }} />

        {/* Group toggles */}
        <div style={{ display: "flex", gap: 4 }}>
          {GROUP_META.map(g => {
            const active = activeGroups.has(g.key);
            return (
              <button
                key={g.key}
                onClick={() => toggleGroup(g.key)}
                style={{
                  padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                  border: active ? `1px solid ${g.color}50` : `1px solid transparent`,
                  background: active ? `${g.color}15` : "transparent",
                  color: active ? g.color : T.t3,
                  fontSize: 11, fontWeight: 600, letterSpacing: 0.2,
                  fontFamily: "'Inter', system-ui, sans-serif",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: active ? g.color : T.t3,
                  boxShadow: active ? `0 0 8px ${g.color}60` : "none",
                  transition: "all 0.2s ease",
                }} />
                {g.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right section */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Live status */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 14px", borderRadius: 10,
          background: status === "live" ? `${T.ok}10` : status === "loading" ? `${T.warn}10` : `${T.err}10`,
          border: `1px solid ${status === "live" ? `${T.ok}25` : status === "loading" ? `${T.warn}25` : `${T.err}25`}`,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: status === "live" ? T.ok : status === "loading" ? T.warn : T.err,
            boxShadow: status === "live" ? `0 0 10px ${T.ok}` : "none",
            animation: status === "live" ? "livePulse 2s infinite" : status === "loading" ? "pulse 1.5s infinite" : "none",
          }} />
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: status === "live" ? T.ok : status === "loading" ? T.warn : T.err,
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5,
          }}>
            {status === "live" ? `${satellites.length.toLocaleString()} SATS` : status === "loading" ? "LOADING" : "ERROR"}
          </span>
        </div>

        <div style={{ width: 1, height: 28, background: `${T.brd}80` }} />

        {/* Action buttons */}
        <Button active={showOrbits} color={T.starlink} onClick={() => setShowOrbits(!showOrbits)} title="Toggle orbits" size="md">
          <Orbit size={14} /> Orbits
        </Button>
        <Button onClick={onRefresh} title="Refresh TLE data" size="md">
          <RefreshCw size={14} />
        </Button>
      </div>
    </div>
  );
}
