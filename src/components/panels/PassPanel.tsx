"use client";
import { useState, useCallback } from "react";
import { useStore } from "@/stores/useStore";
import { theme } from "@/lib/theme";
import { predictPasses } from "@/lib/satellite";
import { X, MapPin, Loader2, Eye, ArrowUp, Navigation } from "lucide-react";
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

function azimuthToCompass(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

function formatPassTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatPassDate(d: Date): string {
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffH = diffMs / 3600000;
  if (diffH < 1) return `${Math.round(diffMs / 60000)} min`;
  if (diffH < 24) return `${Math.round(diffH)}h`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function PassPanel() {
  const T = theme;
  const showPassPanel = useStore(s => s.showPassPanel);
  const setShowPassPanel = useStore(s => s.setShowPassPanel);
  const userLat = useStore(s => s.userLat);
  const userLon = useStore(s => s.userLon);
  const setUserLocation = useStore(s => s.setUserLocation);
  const passes = useStore(s => s.passes);
  const setPasses = useStore(s => s.setPasses);
  const satellites = useStore(s => s.satellites);
  const setSelectedId = useStore(s => s.setSelectedId);

  const [computing, setComputing] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLon, setManualLon] = useState("");

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation(pos.coords.latitude, pos.coords.longitude);
        setManualLat(pos.coords.latitude.toFixed(4));
        setManualLon(pos.coords.longitude.toFixed(4));
      },
      () => {
        // Default to central Europe if denied
        setUserLocation(50.0755, 14.4378);
        setManualLat("50.0755");
        setManualLon("14.4378");
      }
    );
  }, [setUserLocation]);

  const computePasses = useCallback(() => {
    const lat = userLat ?? parseFloat(manualLat);
    const lon = userLon ?? parseFloat(manualLon);
    if (isNaN(lat) || isNaN(lon)) return;

    setUserLocation(lat, lon);
    setComputing(true);

    // Run in a timeout to let UI update
    setTimeout(() => {
      const result = predictPasses(satellites, lat, lon, 24, 10);
      setPasses(result.map(p => ({
        ...p,
        satId: p.satId,
        satName: p.satName,
        group: p.group,
      })));
      setComputing(false);
    }, 50);
  }, [satellites, userLat, userLon, manualLat, manualLon, setUserLocation, setPasses]);

  if (!showPassPanel) return null;

  return (
    <div style={{
      position: "absolute", right: 0, top: 0, bottom: 0, width: 380,
      background: `${T.bg1}f2`, backdropFilter: "blur(24px)",
      borderLeft: `1px solid ${T.brd}`, zIndex: 250,
      display: "flex", flexDirection: "column",
      boxShadow: "-8px 0 40px rgba(0,0,0,0.4)",
      animation: "slideIn 0.3s ease",
    }}>
      {/* Header */}
      <div style={{
        padding: "18px 18px 14px",
        borderBottom: `1px solid ${T.brd}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Eye size={18} color={T.accent} />
            <span style={{ fontSize: 16, fontWeight: 700, color: T.t0 }}>Pass Predictions</span>
          </div>
          <button
            onClick={() => setShowPassPanel(false)}
            style={{
              padding: 8, borderRadius: 10, border: `1px solid ${T.brd}`,
              background: `${T.bg2}80`, color: T.t2, cursor: "pointer",
              display: "flex", alignItems: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Location input */}
        <div style={{
          padding: 12, borderRadius: 12,
          background: T.bg2, border: `1px solid ${T.brd}`,
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6, marginBottom: 10,
            fontSize: 11, color: T.t3, fontWeight: 600,
          }}>
            <MapPin size={12} /> YOUR LOCATION
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: T.t3, marginBottom: 3 }}>Latitude</div>
              <input
                value={manualLat}
                onChange={e => setManualLat(e.target.value)}
                placeholder="50.0755"
                style={{
                  width: "100%", padding: "7px 10px", background: T.bg1,
                  border: `1px solid ${T.brd}`, borderRadius: 8, color: T.t0,
                  fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
                  outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: T.t3, marginBottom: 3 }}>Longitude</div>
              <input
                value={manualLon}
                onChange={e => setManualLon(e.target.value)}
                placeholder="14.4378"
                style={{
                  width: "100%", padding: "7px 10px", background: T.bg1,
                  border: `1px solid ${T.brd}`, borderRadius: 8, color: T.t0,
                  fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
                  outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={detectLocation}
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 10, cursor: "pointer",
                border: `1px solid ${T.accent}40`,
                background: `${T.accent}10`, color: T.accent,
                fontSize: 12, fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              }}
            >
              <Navigation size={13} /> Auto-detect
            </button>
            <button
              onClick={computePasses}
              disabled={computing}
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 10, cursor: "pointer",
                border: `1px solid ${T.ok}40`,
                background: `${T.ok}15`, color: T.ok,
                fontSize: 12, fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                opacity: computing ? 0.6 : 1,
              }}
            >
              {computing ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Eye size={13} />}
              {computing ? "Computing..." : "Find passes"}
            </button>
          </div>
        </div>
      </div>

      {/* Pass list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {passes.length === 0 && !computing && (
          <div style={{
            padding: 24, textAlign: "center", color: T.t3, fontSize: 13,
          }}>
            Set your location and click &quot;Find passes&quot; to see upcoming satellite passes overhead.
          </div>
        )}

        {passes.map((pass, i) => {
          const color = GROUP_COLORS[pass.group];
          const duration = (pass.endTime.getTime() - pass.startTime.getTime()) / 60000;
          return (
            <div
              key={`${pass.satId}_${i}`}
              onClick={() => {
                setSelectedId(pass.satId);
                setShowPassPanel(false);
              }}
              style={{
                padding: "12px 18px", cursor: "pointer",
                borderBottom: `1px solid ${T.brd}40`,
                transition: "background 0.15s ease",
              }}
              onMouseEnter={e => e.currentTarget.style.background = `${T.bg3}60`}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {/* Sat name + time until */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", background: color,
                    boxShadow: `0 0 6px ${color}50`,
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.t0 }}>{pass.satName}</span>
                </div>
                <span style={{
                  fontSize: 11, color: T.accent, fontWeight: 600,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  in {formatPassDate(pass.startTime)}
                </span>
              </div>

              {/* Details row */}
              <div style={{
                display: "flex", gap: 12, fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace", color: T.t3,
              }}>
                <span>{formatPassTime(pass.startTime)} - {formatPassTime(pass.endTime)}</span>
                <span>{duration.toFixed(0)} min</span>
              </div>

              {/* Elevation + azimuth */}
              <div style={{
                display: "flex", gap: 12, marginTop: 4, fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                <span style={{ color, display: "flex", alignItems: "center", gap: 3 }}>
                  <ArrowUp size={10} /> {pass.peakElevation.toFixed(1)}° max
                </span>
                <span style={{ color: T.t2 }}>
                  {azimuthToCompass(pass.peakAzimuth)} ({pass.peakAzimuth.toFixed(0)}°)
                </span>
                {pass.peakElevation > 60 && (
                  <span style={{
                    fontSize: 9, padding: "1px 6px", borderRadius: 4,
                    background: `${T.ok}15`, color: T.ok, fontWeight: 700,
                  }}>
                    BRIGHT
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
