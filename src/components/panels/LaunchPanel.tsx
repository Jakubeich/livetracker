"use client";
import { useState, useEffect } from "react";
import { useStore } from "@/stores/useStore";
import { theme } from "@/lib/theme";
import { X, Rocket, Clock, MapPin, ExternalLink, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

interface Launch {
  id: string;
  name: string;
  net: string; // NET date string
  status: { id: number; name: string; abbrev: string };
  pad: { name: string; location: { name: string } };
  launch_service_provider: { name: string; type: string };
  rocket: { configuration: { name: string; full_name: string } };
  mission: { name: string; description: string; orbit: { name: string; abbrev: string } } | null;
  image: string | null;
  webcast_live: boolean;
  url: string;
}

interface ApiResponse {
  count: number;
  results: Launch[];
}

function getStatusStyle(abbrev: string) {
  const T = theme;
  switch (abbrev) {
    case "Go": return { bg: `${T.ok}15`, border: `${T.ok}40`, color: T.ok, label: "GO" };
    case "TBD": return { bg: `${T.warn}15`, border: `${T.warn}40`, color: T.warn, label: "TBD" };
    case "Success": return { bg: `${T.ok}15`, border: `${T.ok}40`, color: T.ok, label: "SUCCESS" };
    case "Failure": return { bg: `${T.err}15`, border: `${T.err}40`, color: T.err, label: "FAILURE" };
    case "In Flight": return { bg: `${T.accent}15`, border: `${T.accent}40`, color: T.accent, label: "IN FLIGHT" };
    default: return { bg: `${T.t3}15`, border: `${T.t3}40`, color: T.t3, label: abbrev.toUpperCase() };
  }
}

function formatLaunchTime(net: string): string {
  const d = new Date(net);
  const now = new Date();
  const diff = d.getTime() - now.getTime();

  const pad = (n: number) => n.toString().padStart(2, "0");
  const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}`;

  if (Math.abs(diff) < 60000) return "NOW";

  const absDiff = Math.abs(diff);
  const days = Math.floor(absDiff / 86400000);
  const hours = Math.floor((absDiff % 86400000) / 3600000);
  const mins = Math.floor((absDiff % 3600000) / 60000);

  let relative: string;
  if (days > 0) relative = `${days}d ${hours}h`;
  else if (hours > 0) relative = `${hours}h ${mins}m`;
  else relative = `${mins}m`;

  return diff > 0 ? `T-${relative} (${dateStr} ${timeStr})` : `T+${relative} (${dateStr} ${timeStr})`;
}

export function LaunchPanel() {
  const T = theme;
  const show = useStore(s => s.showLaunches);
  const setShow = useStore(s => s.setShowLaunches);
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"upcoming" | "recent">("upcoming");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!show) return;
    setLoading(true);
    setError(null);

    const url = tab === "upcoming"
      ? "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=15&mode=detailed"
      : "https://ll.thespacedevs.com/2.2.0/launch/previous/?limit=15&mode=detailed&ordering=-net";

    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: ApiResponse) => {
        setLaunches(data.results);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [show, tab]);

  if (!show) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
    }}
      onClick={(e) => { if (e.target === e.currentTarget) setShow(false); }}
    >
      <div style={{
        width: 640, maxHeight: "85vh",
        background: `${T.bg1}f8`, backdropFilter: "blur(24px)",
        border: `1px solid ${T.brd}`, borderRadius: 20,
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        animation: "fadeIn 0.2s ease",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 22px 14px",
          borderBottom: `1px solid ${T.brd}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: "linear-gradient(135deg, #f97316, #ef4444)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Rocket size={17} color="#fff" />
            </div>
            <div>
              <span style={{ fontSize: 17, fontWeight: 800, color: T.t0 }}>Launches</span>
              <div style={{ fontSize: 10, color: T.t3, fontFamily: "'JetBrains Mono', monospace", marginTop: 1 }}>
                Launch Library 2 API
              </div>
            </div>
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

        {/* Tabs */}
        <div style={{
          padding: "10px 22px", display: "flex", gap: 6,
          borderBottom: `1px solid ${T.brd}`, flexShrink: 0,
        }}>
          {(["upcoming", "recent"] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setExpandedId(null); }}
              style={{
                padding: "7px 18px", borderRadius: 8, cursor: "pointer",
                border: tab === t ? `1px solid ${T.accent}50` : `1px solid ${T.brd}`,
                background: tab === t ? `${T.accent}15` : `${T.bg2}60`,
                color: tab === t ? T.accent : T.t2,
                fontSize: 12, fontWeight: 600,
                transition: "all 0.15s ease",
                textTransform: "capitalize",
              }}
            >
              {t === "upcoming" ? "Upcoming" : "Recent"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {loading && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", padding: 60, gap: 12,
            }}>
              <Rocket size={28} color={T.accent} style={{ animation: "spin 2s linear infinite" }} />
              <span style={{ fontSize: 13, color: T.t3 }}>Loading launches...</span>
            </div>
          )}

          {error && (
            <div style={{
              margin: "20px 22px", padding: 16, borderRadius: 12,
              background: `${T.err}10`, border: `1px solid ${T.err}30`,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <AlertCircle size={18} color={T.err} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.err }}>Failed to load launches</div>
                <div style={{ fontSize: 11, color: T.t3, marginTop: 2 }}>{error}</div>
              </div>
            </div>
          )}

          {!loading && !error && launches.map(launch => {
            const expanded = expandedId === launch.id;
            const status = getStatusStyle(launch.status.abbrev);
            const isUpcoming = new Date(launch.net).getTime() > Date.now();

            return (
              <div key={launch.id} style={{
                margin: "0 12px 6px", borderRadius: 14,
                border: `1px solid ${T.brd}`,
                background: expanded ? `${T.bg2}60` : `${T.bg2}30`,
                overflow: "hidden",
                transition: "background 0.15s ease",
              }}>
                {/* Launch row */}
                <button
                  onClick={() => setExpandedId(expanded ? null : launch.id)}
                  style={{
                    width: "100%", padding: "12px 16px", cursor: "pointer",
                    border: "none", background: "transparent",
                    display: "flex", alignItems: "center", gap: 12,
                    textAlign: "left",
                  }}
                >
                  {/* Status indicator */}
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                    background: status.color,
                    boxShadow: `0 0 8px ${status.color}50`,
                  }} />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 700, color: T.t0,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {launch.rocket.configuration.name}
                    </div>
                    <div style={{
                      fontSize: 11, color: T.t3, marginTop: 2,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {launch.mission?.name || launch.name}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
                    background: status.bg, border: `1px solid ${status.border}`,
                    color: status.color, fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: 0.5, flexShrink: 0,
                  }}>
                    {status.label}
                  </span>

                  {/* Time */}
                  <div style={{
                    fontSize: 10, color: isUpcoming ? T.accent : T.t2, fontWeight: 600,
                    fontFamily: "'JetBrains Mono', monospace",
                    flexShrink: 0, textAlign: "right", minWidth: 80,
                  }}>
                    {formatLaunchTime(launch.net).split(" (")[0]}
                  </div>

                  {expanded ? <ChevronUp size={14} color={T.t3} /> : <ChevronDown size={14} color={T.t3} />}
                </button>

                {/* Expanded details */}
                {expanded && (
                  <div style={{
                    padding: "0 16px 14px",
                    borderTop: `1px solid ${T.brd}40`,
                    animation: "fadeIn 0.15s ease",
                  }}>
                    <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                      {/* Left details */}
                      <div style={{ flex: 1 }}>
                        <DetailRow icon={<Clock size={11} />} label="NET" value={formatLaunchTime(launch.net)} />
                        <DetailRow icon={<Rocket size={11} />} label="Vehicle" value={launch.rocket.configuration.full_name} />
                        <DetailRow icon={<MapPin size={11} />} label="Pad" value={launch.pad.name} />
                        <DetailRow icon={<MapPin size={11} />} label="Location" value={launch.pad.location.name} />
                        {launch.mission?.orbit && (
                          <DetailRow icon={<span style={{ fontSize: 11 }}>◎</span>} label="Orbit" value={`${launch.mission.orbit.name} (${launch.mission.orbit.abbrev})`} />
                        )}
                        <DetailRow icon={<span style={{ fontSize: 11 }}>🏢</span>} label="Provider" value={launch.launch_service_provider.name} />
                      </div>
                    </div>

                    {/* Mission description */}
                    {launch.mission?.description && (
                      <div style={{
                        marginTop: 10, padding: 12, borderRadius: 10,
                        background: `${T.bg1}80`, border: `1px solid ${T.brd}`,
                        fontSize: 11, color: T.t2, lineHeight: 1.6,
                        maxHeight: 100, overflowY: "auto",
                      }}>
                        {launch.mission.description}
                      </div>
                    )}

                    {/* Image */}
                    {launch.image && (
                      <div style={{
                        marginTop: 10, borderRadius: 10, overflow: "hidden",
                        border: `1px solid ${T.brd}`, height: 140,
                      }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={launch.image}
                          alt={launch.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: "10px 22px 12px",
          borderTop: `1px solid ${T.brd}`,
          fontSize: 10, color: T.t3, fontFamily: "'JetBrains Mono', monospace",
          textAlign: "center", flexShrink: 0,
        }}>
          Data from The Space Devs — Launch Library 2
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const T = theme;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "4px 0", borderBottom: `1px solid ${T.brd}20`,
    }}>
      <span style={{ color: T.t3, flexShrink: 0, width: 14, display: "flex", justifyContent: "center" }}>{icon}</span>
      <span style={{ fontSize: 10, color: T.t3, fontWeight: 600, minWidth: 60 }}>{label}</span>
      <span style={{ fontSize: 11, color: T.t1, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>{value}</span>
    </div>
  );
}
