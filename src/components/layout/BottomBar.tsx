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
      position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)",
      display: "flex", gap: 10, alignItems: "center", zIndex: 180,
    }}>
      {/* Legend */}
      <div style={{
        display: "flex", gap: 12, padding: "5px 14px", borderRadius: 7,
        background: `${T.bg1}dd`, backdropFilter: "blur(10px)", border: `1px solid ${T.brd}`,
      }}>
        {Object.entries(GROUP_LABELS).map(([key, label]) => (
          <div key={key} style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: GROUP_COLORS[key], boxShadow: `0 0 6px ${GROUP_COLORS[key]}55`,
            }} />
            <span style={{ color: T.t2 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div style={{
        padding: "5px 12px", borderRadius: 7,
        background: `${T.bg1}bb`, border: `1px solid ${T.brd}`,
        fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: T.t3,
      }}>
        Drag rotate · Scroll zoom · Click select
      </div>
    </div>
  );
}

export function StatusBanner() {
  const T = theme;
  const status = useStore(s => s.status);
  const satellites = useStore(s => s.satellites);

  // Count by group
  const counts: Record<string, number> = {};
  for (const s of satellites) {
    counts[s.group] = (counts[s.group] || 0) + 1;
  }

  const parts = Object.entries(counts).map(([g, c]) => `${c} ${g}`).join(" · ");

  return (
    <div style={{
      position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)",
      padding: "4px 12px", borderRadius: 5,
      background: status === "live" ? `${T.ok}12` : `${T.warn}12`,
      border: `1px solid ${status === "live" ? `${T.ok}25` : `${T.warn}25`}`,
      display: "flex", alignItems: "center", gap: 5,
      fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
      color: status === "live" ? T.ok : T.warn,
      zIndex: 180,
    }}>
      {status === "live" ? (
        <>LIVE — {satellites.length} satellites tracked{parts ? ` (${parts})` : ""}</>
      ) : status === "loading" ? (
        <>Loading TLE data from CelesTrak...</>
      ) : (
        <>Failed to load satellite data</>
      )}
    </div>
  );
}
