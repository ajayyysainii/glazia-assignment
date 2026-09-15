"use client";

import {
  FILL_COLORS,
  STROKE_COLORS,
  STROKE_SIZES,
  TRANSPARENT,
} from "./constants";
import { GroupLabel, SwatchButton, WidthButton } from "./swatches";

type CanvasPaletteProps = {
  color: string;
  fill: string;
  strokeWidth: number;
  onColorChange: (color: string) => void;
  onFillChange: (fill: string) => void;
  onStrokeWidthChange: (width: number) => void;
};

/**
 * The properties rail: stroke, fill and width docked to the right edge, where
 * a design tool keeps them. Pulling them out of the top bar also lets that bar
 * shrink to tools alone, so it no longer has to scroll on laptop widths.
 *
 * Small screens use the toolbar's style sheet instead — a rail costs canvas
 * width that phones don't have. Positioning belongs to the rail column in
 * DrawingCanvas, so anything stacked below it stays put as this card grows.
 */
export function CanvasPalette({
  color,
  fill,
  strokeWidth,
  onColorChange,
  onFillChange,
  onStrokeWidthChange,
}: CanvasPaletteProps) {
  return (
    <aside
      aria-label="Stroke, fill and width"
      className="flex shrink-0 flex-col gap-3 rounded-2xl bg-white/95 p-3 shadow-[0_10px_40px_rgba(28,32,42,0.12)] ring-1 ring-black/5 backdrop-blur"
    >
      <div>
        <GroupLabel>Stroke</GroupLabel>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {STROKE_COLORS.map((c) => (
            <SwatchButton
              key={`stroke-${c}`}
              value={c}
              selected={color === c}
              label={c === TRANSPARENT ? "No stroke" : `Stroke ${c}`}
              onSelect={onColorChange}
              className="h-7 w-7"
            />
          ))}
        </div>
      </div>

      <div className="h-px bg-[#eef0f4]" />

      <div>
        <GroupLabel>Fill</GroupLabel>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {FILL_COLORS.map((c) => (
            <SwatchButton
              key={`fill-${c}`}
              value={c}
              selected={fill === c}
              label={c === TRANSPARENT ? "No fill" : `Fill ${c}`}
              onSelect={onFillChange}
              className="h-7 w-7"
            />
          ))}
        </div>
      </div>

      <div className="h-px bg-[#eef0f4]" />

      <div>
        <GroupLabel>Width</GroupLabel>
        <div className="mt-2 flex items-center justify-between gap-1">
          {STROKE_SIZES.map((w) => (
            <WidthButton
              key={w}
              width={w}
              selected={strokeWidth === w}
              onSelect={onStrokeWidthChange}
              className="h-8 w-8"
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
