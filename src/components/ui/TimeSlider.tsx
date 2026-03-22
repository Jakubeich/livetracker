"use client";
import { useState, useEffect } from "react";
import { useStore } from "@/stores/useStore";
import { theme } from "@/lib/theme";
import { Play, Pause, RotateCcw, FastForward } from "lucide-react";

function formatTimeOffset(ms: number): string {
  const totalSec = Math.abs(ms / 1000);
  const sign = ms < 0 ? "-" : "+";
  if (totalSec < 60) return `${sign}${Math.round(totalSec)}s`;
  if (totalSec < 3600) return `${sign}${Math.round(totalSec / 60)}m`;
  if (totalSec < 86400) return `${sign}${(totalSec / 3600).toFixed(1)}h`;
  return `${sign}${(totalSec / 86400).toFixed(1)}d`;
}

function pad(n: number): string { return n < 10 ? `0${n}` : `${n}`; }

function formatSimTime(offset: number): string {
  const d = new Date(Date.now() + offset);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatSimDate(offset: number): string {
  const d = new Date(Date.now() + offset);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

const SPEED_OPTIONS = [1, 2, 5, 10, 30, 60];

export function TimeSlider() {
  const T = theme;
  const timeOffset = useStore(s => s.timeOffset);
  const setTimeOffset = useStore(s => s.setTimeOffset);
  const simSpeed = useStore(s => s.simSpeed);
  const setSimSpeed = useStore(s => s.setSimSpeed);
  const paused = useStore(s => s.paused);
  const setPaused = useStore(s => s.setPaused);

  // Tick every second so the clock updates
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Prevent hydration mismatch — only render time after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isLive = timeOffset === 0 && simSpeed === 1 && !paused;

  const resetToLive = () => {
    setTimeOffset(0);
    setSimSpeed(1);
    setPaused(false);
  };

  const cycleSpeed = () => {
    const idx = SPEED_OPTIONS.indexOf(simSpeed);
    const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
    setSimSpeed(next);
    if (paused) setPaused(false);
  };

  // Slider range: -12h to +12h (in ms)
  const maxOffset = 12 * 3600 * 1000;

  return (
    <div style={{
      position: "absolute", bottom: 60, left: "50%", transform: "translateX(-50%)",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
      zIndex: 190, animation: "fadeIn 0.3s ease",
    }}>
      {/* Time display */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "8px 20px", borderRadius: 14,
        background: `${T.bg1}dd`, backdropFilter: "blur(20px)",
        border: `1px solid ${T.brd}60`,
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
      }}>
        {/* Play / Pause */}
        <button
          onClick={() => setPaused(!paused)}
          title={paused ? "Resume (Space)" : "Pause (Space)"}
          style={{
            width: 32, height: 32, borderRadius: 8, cursor: "pointer",
            border: `1px solid ${paused ? `${T.warn}40` : `${T.brd}`}`,
            background: paused ? `${T.warn}15` : `${T.bg2}80`,
            color: paused ? T.warn : T.t1,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {paused ? <Play size={14} /> : <Pause size={14} />}
        </button>

        {/* Speed button */}
        <button
          onClick={cycleSpeed}
          title="Cycle speed"
          style={{
            padding: "4px 10px", borderRadius: 8, cursor: "pointer",
            border: `1px solid ${simSpeed > 1 ? `${T.accent}40` : T.brd}`,
            background: simSpeed > 1 ? `${T.accent}15` : `${T.bg2}80`,
            color: simSpeed > 1 ? T.accent : T.t2,
            fontSize: 12, fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            display: "flex", alignItems: "center", gap: 4,
          }}
        >
          <FastForward size={12} /> {simSpeed}x
        </button>

        <div style={{ width: 1, height: 24, background: `${T.brd}80` }} />

        {/* Clock display */}
        <div style={{ textAlign: "center", minWidth: 100 }}>
          <div style={{
            fontSize: 16, fontWeight: 700, color: T.t0,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {mounted ? formatSimTime(timeOffset) : "--:--:--"}
          </div>
          <div style={{ fontSize: 10, color: T.t3 }}>
            {mounted ? formatSimDate(timeOffset) : "---"}
          </div>
        </div>

        {/* Offset badge */}
        {!isLive && (
          <div style={{
            padding: "3px 8px", borderRadius: 6,
            background: `${T.warn}15`, border: `1px solid ${T.warn}30`,
            fontSize: 11, fontWeight: 700, color: T.warn,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {formatTimeOffset(timeOffset)}
          </div>
        )}

        {isLive && (
          <div style={{
            padding: "3px 8px", borderRadius: 6,
            background: `${T.ok}15`, border: `1px solid ${T.ok}30`,
            fontSize: 11, fontWeight: 700, color: T.ok,
            fontFamily: "'JetBrains Mono', monospace",
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%", background: T.ok,
              animation: "livePulse 2s infinite",
            }} />
            LIVE
          </div>
        )}

        <div style={{ width: 1, height: 24, background: `${T.brd}80` }} />

        {/* Reset to live */}
        <button
          onClick={resetToLive}
          title="Reset to live (L)"
          style={{
            width: 32, height: 32, borderRadius: 8, cursor: "pointer",
            border: `1px solid ${!isLive ? `${T.ok}40` : T.brd}`,
            background: !isLive ? `${T.ok}15` : `${T.bg2}80`,
            color: !isLive ? T.ok : T.t3,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Slider */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "6px 16px", borderRadius: 12,
        background: `${T.bg1}cc`, backdropFilter: "blur(20px)",
        border: `1px solid ${T.brd}40`,
      }}>
        <span style={{ fontSize: 10, color: T.t3, fontFamily: "'JetBrains Mono', monospace" }}>-12h</span>
        <input
          type="range"
          min={-maxOffset}
          max={maxOffset}
          step={60000}
          value={timeOffset}
          onChange={e => {
            setTimeOffset(Number(e.target.value));
            if (simSpeed !== 1) setSimSpeed(1);
          }}
          style={{
            width: 300,
            accentColor: T.accent,
            cursor: "pointer",
          }}
        />
        <span style={{ fontSize: 10, color: T.t3, fontFamily: "'JetBrains Mono', monospace" }}>+12h</span>
      </div>
    </div>
  );
}
