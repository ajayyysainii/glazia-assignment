"use client";

import type { ReactNode } from "react";
import {
  COLORS,
  FILL_COLORS,
  STROKE_SIZES,
  TOOL_TO_SHORTCUT,
  TRANSPARENT_FILL,
} from "./constants";
import {
  IconArrow,
  IconEllipse,
  IconEraser,
  IconHand,
  IconPen,
  IconRect,
  IconRedo,
  IconSelect,
  IconText,
  IconUndo,
} from "./icons";
import type { Tool } from "./types";

const TOOLS: { id: Tool; label: string; icon: ReactNode }[] = [
  { id: "select", label: "Select", icon: <IconSelect /> },
  { id: "hand", label: "Hand", icon: <IconHand /> },
  { id: "pen", label: "Draw", icon: <IconPen /> },
  { id: "rect", label: "Rectangle", icon: <IconRect /> },
  { id: "ellipse", label: "Ellipse", icon: <IconEllipse /> },
  { id: "arrow", label: "Arrow", icon: <IconArrow /> },
  { id: "text", label: "Text", icon: <IconText /> },
  { id: "eraser", label: "Eraser", icon: <IconEraser /> },
];

type CanvasToolbarProps = {
  tool: Tool;
  color: string;
  fill: string;
  strokeWidth: number;
  canUndo: boolean;
  canRedo: boolean;
  onToolChange: (tool: Tool) => void;
  onColorChange: (color: string) => void;
  onFillChange: (fill: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
};

function ShortcutBadge({
  shortcut,
  active,
}: {
  shortcut: string;
  active?: boolean;
}) {
  return (
    <span
      className={`pointer-events-none absolute bottom-0.5 right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded px-0.5 text-[9px] font-semibold leading-none ${
        active ? "bg-white/20 text-white" : "bg-[#1c202a]/8 text-white"
      }`}
    >
      {shortcut}
    </span>
  );
}

function FillSwatch({ fill }: { fill: string }) {
  if (fill === TRANSPARENT_FILL) {
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
      style={{ backgroundColor: fill }}
    />
  );
}

export function CanvasToolbar({
  tool,
  color,
  fill,
  strokeWidth,
  canUndo,
  canRedo,
  onToolChange,
  onColorChange,
  onFillChange,
  onStrokeWidthChange,
  onUndo,
  onRedo,
  onClear,
}: CanvasToolbarProps) {
  return (
    <div className="absolute left-1/2 top-5 z-20 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 overflow-x-auto rounded-2xl bg-white/95 p-1.5 shadow-[0_10px_40px_rgba(28,32,42,0.12)] ring-1 ring-black/5 backdrop-blur">
      {TOOLS.map((t) => {
        const shortcut = TOOL_TO_SHORTCUT[t.id];
        const active = tool === t.id;
        return (
          <button
            key={t.id}
            type="button"
            title={`${t.label} (${shortcut})`}
            aria-label={`${t.label}, shortcut ${shortcut}`}
            onClick={() => onToolChange(t.id)}
            className={`relative flex h-10 w-10 items-center justify-center rounded-xl text-base transition ${
              active
                ? "bg-[#1c202a] text-white"
                : "text-[#3f4555] hover:bg-[#eef0f4]"
            }`}
          >
            {t.icon}
            <ShortcutBadge shortcut={shortcut} active={active} />
          </button>
        );
      })}

      <div className="mx-1 h-6 w-px bg-[#e2e5eb]" />

      <div className="flex items-center gap-1.5">
        <span className="px-1 text-[10px] font-semibold uppercase tracking-wide text-[#9aa0ad]">
          Stroke
        </span>
        {COLORS.map((c) => (
          <button
            key={`stroke-${c}`}
            type="button"
            aria-label={`Stroke ${c}`}
            title={`Stroke ${c}`}
            onClick={() => onColorChange(c)}
            className={`h-7 w-7 rounded-full transition ${
              color === c ? "ring-2 ring-[#1c202a] ring-offset-2" : ""
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <div className="mx-1 h-6 w-px bg-[#e2e5eb]" />

      <div className="flex items-center gap-1.5">
        <span className="px-1 text-[10px] font-semibold uppercase tracking-wide text-[#9aa0ad]">
          Fill
        </span>
        {FILL_COLORS.map((c) => (
          <button
            key={`fill-${c}`}
            type="button"
            aria-label={`Fill ${c}`}
            title={c === TRANSPARENT_FILL ? "No fill" : `Fill ${c}`}
            onClick={() => onFillChange(c)}
            className={`h-7 w-7 overflow-hidden rounded-full transition ${
              fill === c ? "ring-2 ring-[#1c202a] ring-offset-2" : "ring-1 ring-black/10"
            }`}
          >
            <FillSwatch fill={c} />
          </button>
        ))}
      </div>

      <div className="mx-1 h-6 w-px bg-[#e2e5eb]" />

      {STROKE_SIZES.map((w) => (
        <button
          key={w}
          type="button"
          aria-label={`Stroke ${w}`}
          onClick={() => onStrokeWidthChange(w)}
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
            strokeWidth === w ? "bg-[#eef0f4]" : "hover:bg-[#f5f6f8]"
          }`}
        >
          <span
            className="rounded-full bg-[#1c202a]"
            style={{ width: w + 4, height: w + 4 }}
          />
        </button>
      ))}

      <div className="mx-1 h-6 w-px bg-[#e2e5eb]" />

      <button
        type="button"
        title="Undo (⌘Z)"
        aria-label="Undo, shortcut Command Z"
        onClick={onUndo}
        disabled={!canUndo}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#3f4555] transition hover:bg-[#eef0f4] disabled:opacity-30"
      >
        <IconUndo />
        <ShortcutBadge shortcut="Z" />
      </button>
      <button
        type="button"
        title="Redo (⇧⌘Z)"
        aria-label="Redo, shortcut Shift Command Z"
        onClick={onRedo}
        disabled={!canRedo}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#3f4555] transition hover:bg-[#eef0f4] disabled:opacity-30"
      >
        <IconRedo />
        <ShortcutBadge shortcut="⇧Z" />
      </button>
      <button
        type="button"
        title="Clear"
        onClick={onClear}
        className="flex h-10 items-center justify-center rounded-xl px-3 text-sm text-[#3f4555] transition hover:bg-[#eef0f4]"
      >
        Clear
      </button>
    </div>
  );
}
