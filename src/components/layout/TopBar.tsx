"use client";
import { useStore } from "@/stores/useStore";
import { theme } from "@/lib/theme";
import { Button } from "@/components/ui/Button";
import {
  Radio, Moon, Sun, RefreshCw, Orbit, Satellite,
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
  const dk = useStore(s => s.theme) === "dark";
  const setTheme = useStore(s => s.setTheme);
  const status = useStore(s => s.status);
  const satellites = useStore(s => s.satellites);
  const activeGroups = useStore(s => s.activeGroups);
  const toggleGroup = useStore(s => s.toggleGroup);
  const showOrbits = useStore(s => s.showOrbits);
  const setShowOrbits = useStore(s => s.setShowOrbits);

  return (
    <div style={{
      height: 48, background: T.bg1, borderBottom: `1px solid ${T.brd}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 14px", zIndex: 300, flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: "linear-gradient(135deg, #60a5fa, #c084fc)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 16px rgba(96,165,250,0.3)",
          }}>
            <Satellite size={15} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1, color: T.t0 }}>SatTracker</div>
            <div style={{ fontSize: 7, color: T.t3, letterSpacing: 2, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>
              REAL-TIME 3D
            </div>
          </div>
        </div>

        <div style={{ width: 1, height: 24, background: T.brd }} />

        {/* Group toggles */}
        <div style={{ display: "flex", gap: 3 }}>
          {GROUP_META.map(g => (
            <Button
              key={g.key}
              active={activeGroups.has(g.key)}
              color={g.color}
              onClick={() => toggleGroup(g.key)}
            >
              {g.label}
            </Button>
          ))}
        </div>

        <div style={{ width: 1, height: 24, background: T.brd }} />

        {/* Status + count */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: status === "live" ? T.ok : status === "loading" ? T.warn : T.err,
            boxShadow: status === "live" ? `0 0 8px ${T.ok}` : "none",
          }} />
          <span style={{
            fontSize: 9, fontWeight: 700,
            color: status === "live" ? T.ok : status === "loading" ? T.warn : T.err,
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1,
          }}>
            {status === "live" ? `${satellites.length} SATS` : status === "loading" ? "LOADING..." : "ERROR"}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Button active={showOrbits} color={T.starlink} onClick={() => setShowOrbits(!showOrbits)} title="Toggle orbits">
          <Orbit size={10} />
        </Button>
        <Button onClick={onRefresh} title="Refresh TLE data">
          <RefreshCw size={10} />
        </Button>
        <Button onClick={() => setTheme(dk ? "light" : "dark")}>
          {dk ? <Moon size={10} /> : <Sun size={10} />}
        </Button>
      </div>
    </div>
  );
}
