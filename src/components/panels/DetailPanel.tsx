"use client";
import { useMemo } from "react";
import { useStore } from "@/stores/useStore";
import { theme } from "@/lib/theme";
import { Button } from "@/components/ui/Button";
import { X, ExternalLink, Satellite } from "lucide-react";
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

function Field({ label, value, accent }: { label: string; value: string; accent?: string }) {
  const T = theme;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${T.brd}08` }}>
      <span style={{ fontSize: 9, color: T.t3, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</span>
      <span style={{ fontSize: 10, color: accent || T.t0, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>{value || "—"}</span>
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

  return (
    <div style={{
      position: "absolute", right: 0, top: 0, bottom: 0, width: 310,
      background: `${T.bg1}f5`, backdropFilter: "blur(14px)",
      borderLeft: `1px solid ${T.brd}`, zIndex: 200,
      display: "flex", flexDirection: "column", overflowY: "auto",
      boxShadow: "-8px 0 30px rgba(0,0,0,0.4)",
    }}>
      {/* Header */}
      <div style={{ padding: "14px 14px 10px", background: `linear-gradient(135deg, ${color}08, transparent)`, borderBottom: `1px solid ${T.brd}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", gap: 4 }}>
              <span style={{
                fontSize: 9, padding: "2px 6px", borderRadius: 3,
                background: `${color}20`, color, fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                <Satellite size={9} style={{ verticalAlign: -1 }} /> {GROUP_LABELS[sat.group]?.toUpperCase()}
              </span>
              <span style={{
                fontSize: 9, padding: "2px 6px", borderRadius: 3,
                background: `${T.ok}15`, color: T.ok, fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                LIVE
              </span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 6, color: T.t0, letterSpacing: -0.3 }}>
              {sat.name}
            </div>
            <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: T.t3, marginTop: 2 }}>
              NORAD {noradId}
            </div>
          </div>
          <Button onClick={() => setSelectedId(null)} style={{ padding: 5 }}>
            <X size={13} />
          </Button>
        </div>
      </div>

      {/* Position */}
      <div style={{ padding: "10px 14px" }}>
        <div style={{ fontSize: 8, color: T.t3, textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, marginBottom: 4 }}>
          POSITION
        </div>
        <Field label="LAT" value={`${sat.lat.toFixed(4)}°`} />
        <Field label="LON" value={`${sat.lon.toFixed(4)}°`} />
        <Field label="ALTITUDE" value={`${sat.alt.toFixed(1)} km`} accent={color} />
        <Field label="VELOCITY" value={`${(sat.velocity * 3600).toFixed(0)} km/h`} accent={color} />
      </div>

      {/* Orbital data */}
      <div style={{ padding: "4px 14px" }}>
        <div style={{ fontSize: 8, color: T.t3, textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, marginBottom: 4 }}>
          ORBITAL DATA
        </div>
        {orbitalPeriod > 0 && <Field label="PERIOD" value={`${orbitalPeriod.toFixed(1)} min`} />}
        <Field label="ORBIT TYPE" value={
          sat.alt < 2000 ? "LEO" :
          sat.alt < 35786 + 500 && sat.alt > 35786 - 500 ? "GEO" :
          sat.alt < 20200 + 500 && sat.alt > 20200 - 500 ? "MEO" :
          sat.alt > 35786 ? "HEO" : "MEO"
        } />
        <Field label="GROUP" value={GROUP_LABELS[sat.group] || sat.group} />
        <Field label="SOURCE" value="CelesTrak TLE" />
      </div>

      {/* TLE */}
      <div style={{ padding: "4px 14px 14px" }}>
        <div style={{ fontSize: 8, color: T.t3, textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, marginBottom: 4 }}>
          TLE DATA
        </div>
        <div style={{
          background: T.bg2, borderRadius: 6, padding: 8, border: `1px solid ${T.brd}`,
          fontSize: 8, fontFamily: "'JetBrains Mono', monospace", color: T.t2,
          lineHeight: 1.6, wordBreak: "break-all",
        }}>
          {sat.tle1}<br />{sat.tle2}
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: "6px 14px 14px", display: "flex", gap: 5, borderTop: `1px solid ${T.brd}`, marginTop: "auto" }}>
        <a
          href={`https://www.n2yo.com/satellite/?s=${noradId}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            padding: "7px 8px", borderRadius: 5, border: `1px solid ${color}40`,
            background: `${color}10`, color, fontSize: 10, fontWeight: 600,
            textDecoration: "none", fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <ExternalLink size={10} /> N2YO
        </a>
      </div>
    </div>
  );
}
