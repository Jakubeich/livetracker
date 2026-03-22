"use client";
import { useMemo } from "react";
import { useStore } from "@/stores/useStore";
import { theme } from "@/lib/theme";
import { X, BarChart3, Globe2, Gauge, ArrowUp } from "lucide-react";
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

function classifyOrbit(alt: number): string {
  if (alt < 2000) return "LEO";
  if (alt > 35786 - 500 && alt < 35786 + 500) return "GEO";
  if (alt > 20200 - 500 && alt < 20200 + 500) return "MEO";
  if (alt > 35786) return "HEO";
  return "MEO";
}

export function StatsPanel() {
  const T = theme;
  const show = useStore(s => s.showStats);
  const setShow = useStore(s => s.setShowStats);
  const satellites = useStore(s => s.satellites);

  const stats = useMemo(() => {
    if (satellites.length === 0) return null;

    // Group counts
    const groups: Partial<Record<SatGroup, number>> = {};
    for (const s of satellites) groups[s.group] = (groups[s.group] || 0) + 1;

    // Orbit type counts
    const orbits: Record<string, number> = { LEO: 0, MEO: 0, GEO: 0, HEO: 0 };
    let totalAlt = 0, totalVel = 0;
    let minAlt = Infinity, maxAlt = 0;
    let fastest = satellites[0], highest = satellites[0], lowest = satellites[0];

    // Altitude histogram bins (0-500, 500-1000, 1000-2000, 2000-20000, 20000-36000, 36000+)
    const altBins = [
      { label: "0-500", min: 0, max: 500, count: 0 },
      { label: "500-1k", min: 500, max: 1000, count: 0 },
      { label: "1k-2k", min: 1000, max: 2000, count: 0 },
      { label: "2k-20k", min: 2000, max: 20000, count: 0 },
      { label: "20k-36k", min: 20000, max: 36000, count: 0 },
      { label: "36k+", min: 36000, max: Infinity, count: 0 },
    ];

    for (const s of satellites) {
      const orbit = classifyOrbit(s.alt);
      orbits[orbit]++;
      totalAlt += s.alt;
      totalVel += s.velocity;
      if (s.alt < minAlt) { minAlt = s.alt; lowest = s; }
      if (s.alt > maxAlt) { maxAlt = s.alt; highest = s; }
      if (s.velocity > fastest.velocity) fastest = s;
      for (const bin of altBins) {
        if (s.alt >= bin.min && s.alt < bin.max) { bin.count++; break; }
      }
    }

    return {
      total: satellites.length,
      groups,
      orbits,
      avgAlt: totalAlt / satellites.length,
      avgVel: (totalVel / satellites.length) * 3600,
      minAlt,
      maxAlt,
      fastest,
      highest,
      lowest,
      altBins,
    };
  }, [satellites]);

  if (!show || !stats) return null;

  const maxGroupCount = Math.max(...GROUP_META.map(g => stats.groups[g.key] || 0));
  const maxBinCount = Math.max(...stats.altBins.map(b => b.count));
  const orbitTotal = stats.total;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
    }}
      onClick={(e) => { if (e.target === e.currentTarget) setShow(false); }}
    >
      <div style={{
        width: 680, maxHeight: "85vh", overflowY: "auto",
        background: `${T.bg1}f8`, backdropFilter: "blur(24px)",
        border: `1px solid ${T.brd}`, borderRadius: 20,
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        animation: "fadeIn 0.2s ease",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: `1px solid ${T.brd}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BarChart3 size={20} color={T.accent} />
            <span style={{ fontSize: 18, fontWeight: 800, color: T.t0 }}>Statistics</span>
            <span style={{
              fontSize: 11, fontWeight: 700, color: T.accent,
              background: `${T.accent}15`, padding: "3px 10px", borderRadius: 8,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {stats.total.toLocaleString()} satellites
            </span>
          </div>
          <button
            onClick={() => setShow(false)}
            style={{
              padding: 8, borderRadius: 10, border: `1px solid ${T.brd}`,
              background: `${T.bg2}80`, color: T.t2, cursor: "pointer",
              display: "flex", alignItems: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Summary cards */}
        <div style={{ padding: "16px 24px", display: "flex", gap: 10 }}>
          <StatCard label="Avg. Altitude" value={`${stats.avgAlt.toFixed(0)} km`} color={T.starlink} />
          <StatCard label="Avg. Speed" value={`${stats.avgVel.toFixed(0)} km/h`} color={T.accent} />
          <StatCard label="Lowest" value={`${stats.minAlt.toFixed(0)} km`} color={T.ok} sub={stats.lowest.name} />
          <StatCard label="Highest" value={`${stats.maxAlt.toFixed(0)} km`} color={T.comms} sub={stats.highest.name} />
        </div>

        <div style={{ display: "flex", gap: 0 }}>
          {/* Left column */}
          <div style={{ flex: 1, padding: "0 24px 20px" }}>
            {/* Orbit type distribution */}
            <SectionTitle icon={<Globe2 size={13} />} title="Orbit Distribution" />
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {(["LEO", "MEO", "GEO", "HEO"] as const).map(type => {
                const count = stats.orbits[type];
                const pct = ((count / orbitTotal) * 100).toFixed(1);
                const colors: Record<string, string> = { LEO: T.starlink, MEO: T.gps, GEO: T.comms, HEO: T.science };
                return (
                  <div key={type} style={{
                    flex: 1, padding: "10px 8px", borderRadius: 12, textAlign: "center",
                    background: `${colors[type]}08`, border: `1px solid ${colors[type]}20`,
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: colors[type], fontFamily: "'JetBrains Mono', monospace" }}>
                      {count.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: colors[type], marginTop: 2 }}>{type}</div>
                    <div style={{ fontSize: 10, color: T.t3, marginTop: 1 }}>{pct}%</div>
                  </div>
                );
              })}
            </div>

            {/* Altitude histogram */}
            <SectionTitle icon={<ArrowUp size={13} />} title="Altitude Distribution" />
            <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 100 }}>
              {stats.altBins.map(bin => {
                const h = maxBinCount > 0 ? (bin.count / maxBinCount) * 100 : 0;
                return (
                  <div key={bin.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 9, color: T.t2, fontFamily: "'JetBrains Mono', monospace" }}>
                      {bin.count > 0 ? bin.count.toLocaleString() : ""}
                    </span>
                    <div style={{
                      width: "100%", height: `${Math.max(h, 2)}%`, borderRadius: "4px 4px 0 0",
                      background: `linear-gradient(180deg, ${T.accent}, ${T.starlink})`,
                      opacity: bin.count > 0 ? 1 : 0.15,
                      transition: "height 0.3s ease",
                    }} />
                    <span style={{ fontSize: 8, color: T.t3, fontFamily: "'JetBrains Mono', monospace" }}>{bin.label}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 9, color: T.t3, textAlign: "center", marginTop: 4 }}>Altitude (km)</div>
          </div>

          {/* Right column */}
          <div style={{ flex: 1, padding: "0 24px 20px" }}>
            {/* Group breakdown bar chart */}
            <SectionTitle icon={<BarChart3 size={13} />} title="By Group" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {GROUP_META.map(g => {
                const count = stats.groups[g.key] || 0;
                const pct = maxGroupCount > 0 ? (count / maxGroupCount) * 100 : 0;
                return (
                  <div key={g.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      width: 60, fontSize: 11, color: T.t2, fontWeight: 500, textAlign: "right",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {g.label}
                    </span>
                    <div style={{
                      flex: 1, height: 14, borderRadius: 4,
                      background: `${T.bg3}40`, overflow: "hidden",
                    }}>
                      <div style={{
                        width: `${pct}%`, height: "100%", borderRadius: 4,
                        background: `linear-gradient(90deg, ${g.color}80, ${g.color})`,
                        transition: "width 0.3s ease",
                        minWidth: count > 0 ? 2 : 0,
                      }} />
                    </div>
                    <span style={{
                      width: 40, fontSize: 11, fontWeight: 700, color: g.color,
                      fontFamily: "'JetBrains Mono', monospace", textAlign: "right",
                    }}>
                      {count.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Records */}
            <div style={{ marginTop: 16 }}>
              <SectionTitle icon={<Gauge size={13} />} title="Records" />
              <RecordRow label="Fastest" value={`${(stats.fastest.velocity * 3600).toFixed(0)} km/h`} sub={stats.fastest.name} color={T.err} />
              <RecordRow label="Highest" value={`${stats.maxAlt.toFixed(0)} km`} sub={stats.highest.name} color={T.comms} />
              <RecordRow label="Lowest" value={`${stats.minAlt.toFixed(0)} km`} sub={stats.lowest.name} color={T.ok} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  const T = theme;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6, marginBottom: 10,
      fontSize: 11, fontWeight: 700, color: T.t3, letterSpacing: 1,
      textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace",
    }}>
      {icon} {title}
    </div>
  );
}

function StatCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  const T = theme;
  return (
    <div style={{
      flex: 1, padding: "12px 14px", borderRadius: 14,
      background: `${color}08`, border: `1px solid ${color}18`,
      textAlign: "center",
    }}>
      <div style={{ fontSize: 9, color: T.t3, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
      {sub && <div style={{
        fontSize: 9, color: T.t3, marginTop: 3,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>{sub}</div>}
    </div>
  );
}

function RecordRow({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  const T = theme;
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "6px 0", borderBottom: `1px solid ${T.brd}30`,
    }}>
      <div>
        <span style={{ fontSize: 11, color: T.t2, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 10, color: T.t3, marginLeft: 6 }}>{sub}</span>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
    </div>
  );
}
