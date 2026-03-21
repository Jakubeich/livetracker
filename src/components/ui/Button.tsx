import React from "react";
import { theme } from "@/lib/theme";

interface ButtonProps {
  active?: boolean;
  color?: string;
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  title?: string;
  size?: "sm" | "md";
}

export function Button({ active, color, children, onClick, style, title, size = "sm" }: ButtonProps) {
  const c = color || theme.accent;
  const pad = size === "md" ? "7px 14px" : "5px 11px";
  const fs = size === "md" ? 12 : 11;

  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: pad,
        borderRadius: 8,
        border: `1px solid ${active ? `${c}60` : theme.brd}`,
        background: active ? `${c}18` : `${theme.bg2}80`,
        color: active ? c : theme.t2,
        cursor: "pointer",
        fontSize: fs,
        fontWeight: 600,
        letterSpacing: 0.3,
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        whiteSpace: "nowrap",
        fontFamily: "'Inter', system-ui, sans-serif",
        backdropFilter: "blur(8px)",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

interface TagProps {
  color: string;
  children: React.ReactNode;
}

export function Tag({ color, children }: TagProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 10px",
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 600,
        background: `${color}18`,
        color,
        border: `1px solid ${color}30`,
        letterSpacing: 0.2,
      }}
    >
      {children}
    </span>
  );
}
