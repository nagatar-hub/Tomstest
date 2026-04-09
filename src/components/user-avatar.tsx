"use client";

const PALETTES = [
  { bg: "#fef3c7", color: "#92400e" },
  { bg: "#f0fdf4", color: "#166534" },
  { bg: "#eff6ff", color: "#1e40af" },
  { bg: "#fef2f2", color: "#991b1b" },
  { bg: "#f5f3ff", color: "#5b21b6" },
];

interface UserAvatarProps {
  name: string;
  index: number;
}

export function UserAvatar({ name, index }: UserAvatarProps) {
  const p = PALETTES[index % PALETTES.length];
  return (
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center text-[13.5px] font-bold shrink-0"
      style={{
        background: p.bg,
        color: p.color,
        boxShadow: `0 1px 3px ${p.color}15`,
      }}
    >
      {name[0]}
    </div>
  );
}
