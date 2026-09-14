"use client";

import type { ReactNode } from "react";
import { COLORS, STROKE_SIZES } from "./constants";
import {
  IconArrow,
  IconEllipse,
  IconEraser,
  IconHand,
  IconPen,
  IconRect,
  IconRedo,
  IconSelect,
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
  { id: "eraser", label: "Eraser", icon: <IconEraser /> },
];

type CanvasToolbarProps = {
  tool: Tool;
  color: string;
  strokeWidth: number;
  canUndo: boolean;
  canRedo: boolean;
  onToolChange: (tool: Tool) => void;
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
};

export function CanvasToolbar({
  tool,
  color,
  strokeWidth,
  canUndo,
  canRedo,
  onToolChange,
  onColorChange,
  onStrokeWidthChange,
  onUndo,
  onRedo,
  onClear,
}: CanvasToolbarProps) {
  return (
    <div className="absolute left-1/2 top-5 z-20 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 overflow-x-auto rounded-2xl bg-white/95 p-1.5 shadow-[0_10px_40px_rgba(28,32,42,0.12)] ring-1 ring-black/5 backdrop-blur">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          type="button"
          title={t.label}
          aria-label={t.label}
          onClick={() => onToolChange(t.id)}
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-base transition ${
            tool === t.id
              ? "bg-[#1c202a] text-white"
              : "text-[#3f4555] hover:bg-[#eef0f4]"
          }`}
        >
          {t.icon}
        </button>
      ))}

      <div className="mx-1 h-6 w-px bg-[#e2e5eb]" />

      {COLORS.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={`Color ${c}`}
          onClick={() => onColorChange(c)}
          className={`h-7 w-7 rounded-full transition ${
            color === c ? "ring-2 ring-[#1c202a] ring-offset-2" : ""
          }`}
          style={{ backgroundColor: c }}
        />
      ))}

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
        title="Undo"
        onClick={onUndo}
        disabled={!canUndo}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-[#3f4555] transition hover:bg-[#eef0f4] disabled:opacity-30"
      >
        <IconUndo />
      </button>
      <button
        type="button"
        title="Redo"
        onClick={onRedo}
        disabled={!canRedo}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-[#3f4555] transition hover:bg-[#eef0f4] disabled:opacity-30"
      >
        <IconRedo />
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
