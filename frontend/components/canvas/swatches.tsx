"use client";

import { TRANSPARENT } from "./constants";

export function ColorSwatch({ value }: { value: string }) {
  if (value === TRANSPARENT) {
    return (
      <span
        className="block h-full w-full rounded-full"
        style={{
          backgroundImage:
            "linear-gradient(45deg, #d1d5db 25%, transparent 25%), linear-gradient(-45deg, #d1d5db 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d1d5db 75%), linear-gradient(-45deg, transparent 75%, #d1d5db 75%)",
          backgroundSize: "8px 8px",
          backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0",
          backgroundColor: "#fff",
        }}
      />
    );
  }
  return (
    <span
      className="block h-full w-full rounded-full border border-black/10"
      style={{ backgroundColor: value }}
    />
  );
}

export function SwatchButton({
  value,
  selected,
  label,
  onSelect,
  className = "",
}: {
  value: string;
  selected: boolean;
  label: string;
  onSelect: (value: string) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      title={label}
      onClick={() => onSelect(value)}
      className={`overflow-hidden rounded-full transition ${
        selected
          ? "ring-2 ring-[#1c202a] ring-offset-2 ring-offset-white"
          : "ring-1 ring-black/10 hover:ring-black/25"
      } ${className}`}
    >
      <ColorSwatch value={value} />
    </button>
  );
}

export function WidthButton({
  width,
  selected,
  onSelect,
  className = "",
}: {
  width: number;
  selected: boolean;
  onSelect: (width: number) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={`Stroke width ${width}`}
      aria-pressed={selected}
      title={`Stroke width ${width}`}
      onClick={() => onSelect(width)}
      className={`flex items-center justify-center rounded-xl transition ${
        selected ? "bg-[#eef0f4] ring-1 ring-[#1c202a]/15" : "hover:bg-[#f4f5f7]"
      } ${className}`}
    >
      <span
        className="rounded-full bg-[#1c202a]"
        style={{ width: width + 4, height: width + 4 }}
      />
    </button>
  );
}

export function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9aa0ad]">
      {children}
    </span>
  );
}
