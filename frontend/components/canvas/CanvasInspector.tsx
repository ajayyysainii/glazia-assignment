"use client";

import { useEffect, useId, useState } from "react";
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpToLine,
  Trash2,
} from "lucide-react";
import { GroupLabel } from "./swatches";
import type { CanvasShape } from "./types";
import { shapeBounds, translatePoints } from "./utils.bounds";

export type LayerMove = "front" | "forward" | "backward" | "back";

type CanvasInspectorProps = {
  shape: CanvasShape;
  onChange: (id: string, attrs: Partial<CanvasShape>) => void;
  onDelete: (id: string) => void;
  onLayerMove: (id: string, move: LayerMove) => void;
};

/**
 * Numeric editing for the selected element. Dragging and the transform
 * handles cover the coarse work; this is for exact values.
 */
function NumberField({
  label,
  value,
  onCommit,
  step = 1,
  min,
  suffix,
}: {
  label: string;
  value: number;
  onCommit: (next: number) => void;
  step?: number;
  min?: number;
  suffix?: string;
}) {
  const id = useId();
  // Local draft so a partly-typed value ("-", "12.") isn't pushed into the
  // document, and so each keystroke doesn't become an undo step.
  const [draft, setDraft] = useState(String(Math.round(value * 100) / 100));

  useEffect(() => {
    setDraft(String(Math.round(value * 100) / 100));
  }, [value]);

  const commit = () => {
    const parsed = Number(draft);
    if (!Number.isFinite(parsed)) {
      setDraft(String(Math.round(value * 100) / 100));
      return;
    }
    const clamped = min !== undefined ? Math.max(min, parsed) : parsed;
    if (clamped !== value) onCommit(clamped);
    setDraft(String(Math.round(clamped * 100) / 100));
  };

  return (
    <label htmlFor={id} className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9aa0ad]">
        {label}
      </span>
      <span className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step={step}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
              (e.target as HTMLInputElement).blur();
            }
            if (e.key === "Escape") {
              setDraft(String(Math.round(value * 100) / 100));
              (e.target as HTMLInputElement).blur();
            }
            // Konva's global shortcuts would otherwise swallow typing.
            e.stopPropagation();
          }}
          className={`w-full rounded-lg bg-[#f4f5f7] px-2 py-1.5 text-[13px] tabular-nums text-[#1c202a] outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-[#1c202a]/25 ${
            suffix ? "pr-5" : ""
          }`}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-[#9aa0ad]">
            {suffix}
          </span>
        ) : null}
      </span>
    </label>
  );
}

const LAYER_ACTIONS: {
  move: LayerMove;
  label: string;
  icon: typeof ArrowUp;
}[] = [
  { move: "back", label: "Send to back", icon: ArrowDownToLine },
  { move: "backward", label: "Send backward", icon: ArrowDown },
  { move: "forward", label: "Bring forward", icon: ArrowUp },
  { move: "front", label: "Bring to front", icon: ArrowUpToLine },
];

export function CanvasInspector({
  shape,
  onChange,
  onDelete,
  onLayerMove,
}: CanvasInspectorProps) {
  const set = (attrs: Partial<CanvasShape>) => onChange(shape.id, attrs);
  const pointsBased = shape.kind === "line" || shape.kind === "arrow";
  const bounds = shapeBounds(shape);

  return (
    <div className="flex shrink-0 flex-col gap-3 rounded-2xl bg-white/95 p-3 shadow-[0_10px_40px_rgba(28,32,42,0.12)] ring-1 ring-black/5 backdrop-blur">
      <div className="flex items-center justify-between">
        <GroupLabel>
          {shape.kind === "line"
            ? shape.tool === "eraser"
              ? "Eraser"
              : "Drawing"
            : shape.kind}
        </GroupLabel>
        <button
          type="button"
          onClick={() => onDelete(shape.id)}
          aria-label="Delete element"
          title="Delete element (Del)"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6b7285] transition hover:bg-[#fff1f0] hover:text-[#c92a2a]"
        >
          <Trash2 size={14} strokeWidth={1.8} />
        </button>
      </div>

      <div>
        <GroupLabel>Position</GroupLabel>
        <div className="mt-1.5 flex gap-2">
          <NumberField
            label="X"
            value={pointsBased ? (bounds?.minX ?? 0) : shape.x}
            onCommit={(next) => {
              if (pointsBased) {
                const dx = next - (bounds?.minX ?? 0);
                set({ points: translatePoints(shape.points, dx, 0) });
              } else {
                set({ x: next });
              }
            }}
          />
          <NumberField
            label="Y"
            value={pointsBased ? (bounds?.minY ?? 0) : shape.y}
            onCommit={(next) => {
              if (pointsBased) {
                const dy = next - (bounds?.minY ?? 0);
                set({ points: translatePoints(shape.points, 0, dy) });
              } else {
                set({ y: next });
              }
            }}
          />
        </div>
      </div>

      {shape.kind === "rect" ? (
        <div>
          <GroupLabel>Size</GroupLabel>
          <div className="mt-1.5 flex gap-2">
            <NumberField
              label="W"
              value={shape.width}
              min={1}
              onCommit={(width) => set({ width })}
            />
            <NumberField
              label="H"
              value={shape.height}
              min={1}
              onCommit={(height) => set({ height })}
            />
          </div>
        </div>
      ) : null}

      {shape.kind === "ellipse" ? (
        <div>
          <GroupLabel>Radius</GroupLabel>
          <div className="mt-1.5 flex gap-2">
            <NumberField
              label="RX"
              value={shape.radiusX}
              min={1}
              onCommit={(radiusX) => set({ radiusX })}
            />
            <NumberField
              label="RY"
              value={shape.radiusY}
              min={1}
              onCommit={(radiusY) => set({ radiusY })}
            />
          </div>
        </div>
      ) : null}

      {shape.kind === "text" ? (
        <>
          <div>
            <GroupLabel>Type size & box</GroupLabel>
            <div className="mt-1.5 flex gap-2">
              <NumberField
                label="Size"
                value={shape.fontSize}
                min={4}
                onCommit={(fontSize) => set({ fontSize })}
              />
              <NumberField
                label="W"
                value={shape.width ?? 220}
                min={20}
                onCommit={(width) => set({ width })}
              />
            </div>
          </div>
          <div>
            <GroupLabel>Text</GroupLabel>
            <textarea
              value={shape.text}
              rows={2}
              onChange={(e) => set({ text: e.target.value })}
              onKeyDown={(e) => e.stopPropagation()}
              className="mt-1.5 w-full resize-y rounded-lg bg-[#f4f5f7] px-2 py-1.5 text-[13px] text-[#1c202a] outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-[#1c202a]/25"
            />
          </div>
        </>
      ) : null}

      {shape.kind !== "line" ? (
        <div>
          <GroupLabel>Rotation</GroupLabel>
          <div className="mt-1.5 flex gap-2">
            <NumberField
              label="Angle"
              value={shape.rotation ?? 0}
              suffix="°"
              onCommit={(rotation) => set({ rotation })}
            />
          </div>
        </div>
      ) : null}

      <div>
        <GroupLabel>Layer</GroupLabel>
        <div className="mt-1.5 grid grid-cols-4 gap-1">
          {LAYER_ACTIONS.map(({ move, label, icon: Icon }) => (
            <button
              key={move}
              type="button"
              onClick={() => onLayerMove(shape.id, move)}
              title={label}
              aria-label={label}
              className="flex h-8 items-center justify-center rounded-lg text-[#3f4555] transition hover:bg-[#eef0f4] hover:text-[#1c202a]"
            >
              <Icon size={15} strokeWidth={1.8} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
