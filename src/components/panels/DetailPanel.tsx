"use client";
import { useMemo } from "react";
import { useStore } from "@/stores/useStore";
import { theme } from "@/lib/theme";
import { Button } from "@/components/ui/Button";
import { X, ExternalLink, Satellite, MapPin, Gauge, Clock, Globe2 } from "lucide-react";
import type { SatGroup } from "@/types";

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
  stations: "Space Station",
  starlink: "Starlink",
  oneweb: "OneWeb",
  gps: "GNSS Navigation",
  comms: "Communications",
  weather: "Weather",
  science: "Science",
  military: "Military",
  other: "Other",
};

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  const T = theme;
  return (
    <div style={{ padding: "12px 18px" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6, marginBottom: 8,
        fontSize: 10, color: T.t3, textTransform: "uppercase", letterSpacing: 1.5,
        fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
      }}>
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, accent }: { label: string; value: string; accent?: string }) {
  const T = theme;
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "6px 0", borderBottom: `1px solid ${T.brd}30`,
    }}>
      <span style={{
        fontSize: 11, color: T.t3, fontWeight: 500,
      }}>{label}</span>
      <span style={{
        fontSize: 12, color: accent || T.t0,
        fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
      }}>{value || "---"}</span>
    </div>
  );
}

export function DetailPanel() {
  const T = theme;
  const selectedId = useStore(s => s.selectedId);
  const setSelectedId = useStore(s => s.setSelectedId);
  const satellites = useStore(s => s.satellites);

  const sat = useMemo(() => satellites.find(s => s.id === selectedId), [satellites, selectedId]);

  if (!sat) return null;

  const color = GROUP_COLORS[sat.group];
  const noradId = sat.id.split("_")[1] || sat.id;
  const orbitalPeriod = sat.alt > 0
    ? (2 * Math.PI * Math.sqrt(Math.pow(6371 + sat.alt, 3) / 398600.4418)) / 60
    : 0;

  const orbitType = sat.alt < 2000 ? "LEO" :
    sat.alt < 35786 + 500 && sat.alt > 35786 - 500 ? "GEO" :
    sat.alt < 20200 + 500 && sat.alt > 20200 - 500 ? "MEO" :
    sat.alt > 35786 ? "HEO" : "MEO";

  return (
    <div style={{
      position: "absolute", right: 0, top: 0, bottom: 0, width: 360,
      background: `${T.bg1}f2`, backdropFilter: "blur(24px)",
      borderLeft: `1px solid ${T.brd}`, zIndex: 200,
      display: "flex", flexDirection: "column", overflowY: "auto",
      boxShadow: "-8px 0 40px rgba(0,0,0,0.4)",
      animation: "slideIn 0.3s ease",
    }}>
      {/* Header */}
      <div style={{
        padding: "18px 18px 14px",
        background: `linear-gradient(135deg, ${color}08, transparent)`,
        borderBottom: `1px solid ${T.brd}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <span style={{
                fontSize: 10, padding: "3px 10px", borderRadius: 8,
                background: `${color}18`, color, fontWeight: 700,
                display: "inline-flex", alignItems: "center", gap: 4,
              }}>
                <Satellite size={10} /> {GROUP_LABELS[sat.group]?.toUpperCase()}
              </span>
              <span style={{
                fontSize: 10, padding: "3px 10px", borderRadius: 8,
                background: `${T.ok}12`, color: T.ok, fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                display: "inline-flex", alignItems: "center", gap: 4,
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%", background: T.ok,
                  animation: "livePulse 2s infinite",
                }} />
                LIVE
              </span>
            </div>
            <div style={{
              fontSize: 20, fontWeight: 800, color: T.t0,
              letterSpacing: -0.5, lineHeight: 1.2,
            }}>
              {sat.name}
            </div>
            <div style={{
              fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
              color: T.t3, marginTop: 4, fontWeight: 500,
            }}>
              NORAD {noradId}
            </div>
          </div>
          <button
            onClick={() => setSelectedId(null)}
            style={{
              padding: 8, borderRadius: 10, border: `1px solid ${T.brd}`,
              background: `${T.bg2}80`, color: T.t2, cursor: "pointer",
              display: "flex", alignItems: "center",
              backdropFilter: "blur(8px)",
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Position */}
      <Section icon={<MapPin size={11} />} title="Position">
        <Field label="Latitude" value={`${sat.lat.toFixed(4)}°`} />
        <Field label="Longitude" value={`${sat.lon.toFixed(4)}°`} />
        <Field label="Altitude" value={`${sat.alt.toFixed(1)} km`} accent={color} />
        <Field label="Velocity" value={`${(sat.velocity * 3600).toFixed(0)} km/h`} accent={color} />
      </Section>

      {/* Orbital data */}
      <Section icon={<Globe2 size={11} />} title="Orbital Data">
        {orbitalPeriod > 0 && <Field label="Period" value={`${orbitalPeriod.toFixed(1)} min`} />}
        <Field label="Orbit Type" value={orbitType} />
        <Field label="Group" value={GROUP_LABELS[sat.group] || sat.group} />
        <Field label="Source" value="CelesTrak TLE" />
      </Section>

      {/* Stats cards */}
      <div style={{ padding: "4px 18px", display: "flex", gap: 8 }}>
        <div style={{
          flex: 1, padding: "10px 12px", borderRadius: 12,
          background: `${color}08`, border: `1px solid ${color}20`,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace" }}>
            {sat.alt.toFixed(0)}
          </div>
          <div style={{ fontSize: 10, color: T.t3, marginTop: 2 }}>km altitude</div>
        </div>
        <div style={{
          flex: 1, padding: "10px 12px", borderRadius: 12,
          background: `${T.accent}08`, border: `1px solid ${T.accent}20`,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.accent, fontFamily: "'JetBrains Mono', monospace" }}>
            {(sat.velocity * 3600).toFixed(0)}
          </div>
          <div style={{ fontSize: 10, color: T.t3, marginTop: 2 }}>km/h speed</div>
        </div>
      </div>

      {/* TLE */}
      <Section icon={<Clock size={11} />} title="TLE Data">
        <div style={{
          background: T.bg2, borderRadius: 10, padding: 12,
          border: `1px solid ${T.brd}`,
          fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: T.t2,
          lineHeight: 1.8, wordBreak: "break-all",
        }}>
          {sat.tle1}<br />{sat.tle2}
        </div>
      </Section>

      {/* Actions */}
      <div style={{
        padding: "12px 18px 18px",
        display: "flex", gap: 8, borderTop: `1px solid ${T.brd}`, marginTop: "auto",
      }}>
        <a
          href={`https://www.n2yo.com/satellite/?s=${noradId}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "10px 12px", borderRadius: 10,
            border: `1px solid ${color}40`,
            background: `${color}10`, color, fontSize: 12, fontWeight: 600,
            textDecoration: "none",
            transition: "all 0.15s ease",
          }}
        >
          <ExternalLink size={13} /> Track on N2YO
        </a>
        <a
          href={`https://celestrak.org/NORAD/elements/gp.php?CATNR=${noradId}&FORMAT=tle`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "10px 12px", borderRadius: 10,
            border: `1px solid ${T.accent}40`,
            background: `${T.accent}10`, color: T.accent, fontSize: 12, fontWeight: 600,
            textDecoration: "none",
            transition: "all 0.15s ease",
          }}
        >
          <ExternalLink size={13} /> CelesTrak
        </a>
      </div>
    </div>
  );
}
