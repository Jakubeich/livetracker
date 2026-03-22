"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { useStore } from "@/stores/useStore";
import { theme } from "@/lib/theme";
import { Button } from "@/components/ui/Button";
import {
  RefreshCw, Orbit, Satellite, Eye, Filter, Check, BarChart3, Rocket,
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
  const showOrbits = useStore(s => s.showOrbits);
  const setShowOrbits = useStore(s => s.setShowOrbits);
  const showPassPanel = useStore(s => s.showPassPanel);
  const setShowPassPanel = useStore(s => s.setShowPassPanel);
  const setShowStats = useStore(s => s.setShowStats);
  const setShowLaunches = useStore(s => s.setShowLaunches);

  const activeCount = activeGroups.size;

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

        {/* Filters dropdown */}
        <FilterDropdown satellites={satellites} />

        {/* Active group pills — compact preview */}
        <div style={{ display: "flex", gap: 3 }}>
          {GROUP_META.map(g => (
            <div
              key={g.key}
              title={g.label}
              style={{
                width: 10, height: 10, borderRadius: "50%",
                background: activeGroups.has(g.key) ? g.color : `${T.t3}30`,
                boxShadow: activeGroups.has(g.key) ? `0 0 6px ${g.color}50` : "none",
                transition: "all 0.2s ease",
              }}
            />
          ))}
        </div>
      </div>

      {/* Right section */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Live status with tooltip */}
        <SatsTooltip status={status} satellites={satellites} />

        <div style={{ width: 1, height: 28, background: `${T.brd}80` }} />

        {/* Action buttons */}
        <Button active={showOrbits} color={T.starlink} onClick={() => setShowOrbits(!showOrbits)} title="Toggle orbits (O)" size="md">
          <Orbit size={14} /> Orbits
        </Button>
        <Button active={showPassPanel} color={T.accent} onClick={() => setShowPassPanel(!showPassPanel)} title="Pass predictions (P)" size="md">
          <Eye size={14} /> Passes
        </Button>
        <Button color={T.starlink} onClick={() => setShowStats(true)} title="Statistics (D)" size="md">
          <BarChart3 size={14} /> Stats
        </Button>
        <Button color={T.weather} onClick={() => setShowLaunches(true)} title="Recent launches (R)" size="md">
          <Rocket size={14} /> Launches
        </Button>
        <Button onClick={onRefresh} title="Refresh TLE data" size="md">
          <RefreshCw size={14} />
        </Button>
      </div>
    </div>
  );
}

/* ── Filter Dropdown ── */
function FilterDropdown({ satellites }: { satellites: { group: SatGroup }[] }) {
  const T = theme;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeGroups = useStore(s => s.activeGroups);
  const toggleGroup = useStore(s => s.toggleGroup);

  const counts = useMemo(() => {
    const c: Partial<Record<SatGroup, number>> = {};
    for (const s of satellites) c[s.group] = (c[s.group] || 0) + 1;
    return c;
  }, [satellites]);

  const allActive = activeGroups.size === GROUP_META.length;

  const toggleAll = () => {
    for (const g of GROUP_META) {
      const has = activeGroups.has(g.key);
      if (allActive && has) toggleGroup(g.key);
      if (!allActive && !has) toggleGroup(g.key);
    }
  };

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: "6px 14px", borderRadius: 10, cursor: "pointer",
          border: open ? `1px solid ${T.accent}50` : `1px solid ${T.brd}`,
          background: open ? `${T.accent}12` : `${T.bg2}80`,
          color: open ? T.accent : T.t1,
          fontSize: 12, fontWeight: 600,
          fontFamily: "'Inter', sans-serif",
          display: "flex", alignItems: "center", gap: 7,
          backdropFilter: "blur(8px)",
        }}
      >
        <Filter size={13} />
        Filters
        <span style={{
          fontSize: 10, fontWeight: 700, color: T.accent,
          background: `${T.accent}18`, padding: "1px 7px", borderRadius: 6,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {activeGroups.size}/{GROUP_META.length}
        </span>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0,
          width: 280, borderRadius: 16,
          background: `${T.bg1}f8`, backdropFilter: "blur(24px)",
          border: `1px solid ${T.brd}`,
          boxShadow: "0 12px 48px rgba(0,0,0,0.5)",
          zIndex: 500, animation: "fadeIn 0.15s ease",
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            padding: "12px 16px", borderBottom: `1px solid ${T.brd}`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: T.t3, letterSpacing: 1,
              textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace",
            }}>
              Satellite Groups
            </span>
            <button
              onClick={toggleAll}
              style={{
                padding: "3px 10px", borderRadius: 6, cursor: "pointer",
                border: `1px solid ${T.accent}30`,
                background: `${T.accent}10`, color: T.accent,
                fontSize: 11, fontWeight: 600,
              }}
            >
              {allActive ? "None" : "All"}
            </button>
          </div>

          {/* Group list */}
          <div style={{ padding: "6px 0" }}>
            {GROUP_META.map(g => {
              const active = activeGroups.has(g.key);
              const count = counts[g.key] || 0;
              return (
                <button
                  key={g.key}
                  onClick={() => toggleGroup(g.key)}
                  style={{
                    width: "100%", padding: "9px 16px", cursor: "pointer",
                    border: "none",
                    background: active ? `${g.color}08` : "transparent",
                    display: "flex", alignItems: "center", gap: 10,
                    transition: "background 0.15s ease",
                  }}
                >
                  {/* Checkbox */}
                  <div style={{
                    width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                    border: active ? `2px solid ${g.color}` : `2px solid ${T.t3}40`,
                    background: active ? `${g.color}20` : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s ease",
                  }}>
                    {active && <Check size={11} color={g.color} strokeWidth={3} />}
                  </div>

                  {/* Color dot */}
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                    background: g.color,
                    boxShadow: active ? `0 0 8px ${g.color}50` : "none",
                    opacity: active ? 1 : 0.3,
                    transition: "all 0.2s ease",
                  }} />

                  {/* Label */}
                  <span style={{
                    flex: 1, textAlign: "left",
                    fontSize: 13, fontWeight: active ? 600 : 500,
                    color: active ? T.t0 : T.t3,
                    transition: "color 0.15s ease",
                  }}>
                    {g.label}
                  </span>

                  {/* Count */}
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: active ? g.color : T.t3,
                    fontFamily: "'JetBrains Mono', monospace",
                    opacity: active ? 1 : 0.5,
                    minWidth: 36, textAlign: "right",
                  }}>
                    {count > 0 ? count.toLocaleString() : "—"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{
            padding: "8px 16px 10px", borderTop: `1px solid ${T.brd}`,
            fontSize: 10, color: T.t3, fontFamily: "'JetBrains Mono', monospace",
            textAlign: "center",
          }}>
            {satellites.length.toLocaleString()} total satellites loaded
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Stats Tooltip ── */
function SatsTooltip({ status, satellites }: { status: string; satellites: { group: SatGroup }[] }) {
  const T = theme;
  const [hover, setHover] = useState(false);

  const counts = useMemo(() => {
    const c: Partial<Record<SatGroup, number>> = {};
    for (const s of satellites) c[s.group] = (c[s.group] || 0) + 1;
    return c;
  }, [satellites]);

  const statusColor = status === "live" ? T.ok : status === "loading" ? T.warn : T.err;

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "6px 14px", borderRadius: 10, cursor: "default",
        background: `${statusColor}10`,
        border: `1px solid ${statusColor}25`,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: statusColor,
          boxShadow: status === "live" ? `0 0 10px ${statusColor}` : "none",
          animation: status === "live" ? "livePulse 2s infinite" : status === "loading" ? "pulse 1.5s infinite" : "none",
        }} />
        <span style={{
          fontSize: 11, fontWeight: 700, color: statusColor,
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5,
        }}>
          {status === "live" ? `${satellites.length.toLocaleString()} SATS` : status === "loading" ? "LOADING" : "ERROR"}
        </span>
      </div>

      {hover && status === "live" && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          padding: "14px 18px", borderRadius: 14, minWidth: 240,
          background: `${T.bg1}f5`, backdropFilter: "blur(20px)",
          border: `1px solid ${T.brd}`,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          zIndex: 400, animation: "fadeIn 0.15s ease",
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: T.t3, letterSpacing: 1,
            marginBottom: 10, textTransform: "uppercase",
            fontFamily: "'JetBrains Mono', monospace",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%", background: T.ok,
              animation: "livePulse 2s infinite",
            }} />
            LIVE — {satellites.length.toLocaleString()} satellites
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {GROUP_META.map(g => {
              const count = counts[g.key] || 0;
              if (count === 0) return null;
              return (
                <div key={g.key} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%", background: g.color,
                      boxShadow: `0 0 6px ${g.color}40`,
                    }} />
                    <span style={{ fontSize: 12, color: T.t1, fontWeight: 500 }}>{g.label}</span>
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 700, color: g.color,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {count.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
