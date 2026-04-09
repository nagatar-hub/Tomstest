"use client";

interface ProgressBarProps {
  value: number;
  invert?: boolean;
}

export function ProgressBar({ value, invert }: ProgressBarProps) {
  const color = invert
    ? (value >= 70 ? "#b91c1c" : value >= 50 ? "#a16207" : "#15803d")
    : (value >= 80 ? "#15803d" : value >= 60 ? "#a16207" : "#b91c1c");

  return (
    <div className="flex items-center gap-[10px]">
      <div
        className="w-[60px] h-[5px] rounded-[3px] overflow-hidden"
        style={{ background: `${color}18` }}
      >
        <div
          className="h-full rounded-[3px]"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}90, ${color})`,
            transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>
      <span className="font-mono text-[13px] font-semibold min-w-[36px]" style={{ color: "#292524" }}>
        {value}%
      </span>
    </div>
  );
}
