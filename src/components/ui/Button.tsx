import React from "react";
import { theme } from "@/lib/theme";

interface ButtonProps {
  active?: boolean;
  color?: string;
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  title?: string;
}

export function Button({ active, color, children, onClick, style, title }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: "4px 9px",
        borderRadius: 5,
        border: `1px solid ${active ? (color || theme.starlink) : theme.brd}`,
        background: active ? `${color || theme.starlink}20` : "transparent",
        color: active ? (color || theme.starlink) : theme.t2,
        cursor: "pointer",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 0.5,
        display: "flex",
        alignItems: "center",
        gap: 4,
        whiteSpace: "nowrap",
        fontFamily: "'JetBrains Mono', monospace",
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
        gap: 3,
        padding: "1px 7px",
        borderRadius: 10,
        fontSize: 9,
        fontWeight: 600,
        background: `${color}20`,
        color,
        border: `1px solid ${color}30`,
      }}
    >
      {children}
    </span>
  );
}
