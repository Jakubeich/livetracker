"use client";
import { useStore } from "@/stores/useStore";
import { theme } from "@/lib/theme";

const GROUP_COLORS: Record<string, string> = {
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
  stations: "Stations",
  starlink: "Starlink",
  oneweb: "OneWeb",
  gps: "GNSS",
  comms: "Comms",
  weather: "Weather",
  science: "Science",
  military: "Military",
  other: "Other",
};

export function BottomBar() {
  const T = theme;

  return (
    <div style={{
      position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
      display: "flex", gap: 10, alignItems: "center", zIndex: 180,
      animation: "fadeIn 0.5s ease",
    }}>
      {/* Legend */}
      <div style={{
        display: "flex", gap: 16, padding: "8px 20px", borderRadius: 14,
        background: `${T.bg1}cc`, backdropFilter: "blur(20px)",
        border: `1px solid ${T.brd}60`,
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
      }}>
        {Object.entries(GROUP_LABELS).map(([key, label]) => (
          <div key={key} style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 11, fontFamily: "'Inter', sans-serif", fontWeight: 500,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: GROUP_COLORS[key],
              boxShadow: `0 0 8px ${GROUP_COLORS[key]}40`,
            }} />
            <span style={{ color: T.t2 }}>{label}</span>
          </div>
        ))}
      </div>

    </div>
  );
}

export function StatusBanner() {
  const T = theme;
  const status = useStore(s => s.status);
  const satellites = useStore(s => s.satellites);

  const counts: Record<string, number> = {};
  for (const s of satellites) {
    counts[s.group] = (counts[s.group] || 0) + 1;
  }

  const parts = Object.entries(counts).map(([g, c]) => `${c} ${g}`).join(" · ");

  return (
    <div style={{
      position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
      padding: "7px 18px", borderRadius: 12,
      background: status === "live" ? `${T.ok}10` : `${T.warn}10`,
      border: `1px solid ${status === "live" ? `${T.ok}20` : `${T.warn}20`}`,
      backdropFilter: "blur(16px)",
      boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
      display: "flex", alignItems: "center", gap: 8,
      fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
      color: status === "live" ? T.ok : T.warn,
      zIndex: 180, fontWeight: 500,
      animation: "fadeIn 0.3s ease",
    }}>
      <div style={{
        width: 7, height: 7, borderRadius: "50%",
        background: status === "live" ? T.ok : T.warn,
        animation: status === "live" ? "livePulse 2s infinite" : "pulse 1.5s infinite",
      }} />
      {status === "live" ? (
        <>LIVE — {satellites.length.toLocaleString()} satellites tracked{parts ? ` (${parts})` : ""}</>
      ) : status === "loading" ? (
        <>Loading TLE data from CelesTrak...</>
      ) : (
        <>Failed to load satellite data</>
      )}
    </div>
  );
}
