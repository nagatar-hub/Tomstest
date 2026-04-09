"use client";

import { useState } from "react";

interface GlassStatProps {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  color: string;
  colorBg: string;
  large?: boolean;
}

export function GlassStat({ label, value, sub, icon, color, colorBg, large }: GlassStatProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative overflow-hidden flex flex-col justify-between cursor-default"
      style={{
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: large ? 18 : 14,
        padding: large ? "28px 26px" : "22px 20px",
        border: `1.5px solid ${hovered ? color + "40" : "rgba(255,255,255,0.7)"}`,
        boxShadow: hovered
          ? `0 8px 32px ${color}12, 0 2px 8px rgba(0,0,0,0.04)`
          : "0 2px 12px rgba(180,83,9,0.06), 0 1px 3px rgba(0,0,0,0.02)",
        minHeight: large ? 160 : 120,
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
      }}
    >
      {/* Accent glow */}
      <div
        className="absolute rounded-full transition-opacity duration-300"
        style={{
          top: large ? -20 : -15,
          right: large ? -20 : -15,
          width: large ? 100 : 72,
          height: large ? 100 : 72,
          background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`,
          opacity: hovered ? 1 : 0.5,
        }}
      />

      <div className="relative z-[1]">
        <div className="flex items-center justify-between" style={{ marginBottom: large ? 16 : 10 }}>
          <span
            className="text-[11.5px] font-semibold uppercase"
            style={{ color: "#a8a29e", letterSpacing: "0.06em" }}
          >
            {label}
          </span>
          <div
            className="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-sm transition-transform duration-200"
            style={{
              background: colorBg,
              transform: hovered ? "scale(1.1)" : "scale(1)",
            }}
          >
            {icon}
          </div>
        </div>
        <div
          className="font-mono font-bold"
          style={{
            fontSize: large ? 44 : 34,
            color: "#292524",
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}
        >
          {value}
        </div>
      </div>

      {sub && (
        <div className="relative z-[1] flex items-center gap-[5px] mt-[14px]" style={{ fontSize: 12, fontWeight: 500, color }}>
          <span
            className="inline-block w-4 h-4 rounded-[5px] text-center leading-4 text-[10px]"
            style={{ background: colorBg }}
          >
            ↑
          </span>
          {sub}
        </div>
      )}
    </div>
  );
}
