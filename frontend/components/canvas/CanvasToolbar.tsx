"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import {
  FILL_COLORS,
  STROKE_COLORS,
  STROKE_SIZES,
  TOOL_TO_SHORTCUT,
  TRANSPARENT,
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
import { GroupLabel, SwatchButton, WidthButton } from "./swatches";
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
      className={`pointer-events-none absolute bottom-0.5 right-0.5 hidden h-3.5 min-w-3.5 items-center justify-center rounded px-0.5 text-[9px] font-semibold leading-none lg:flex ${
        active ? "bg-white/20 text-white" : "bg-[#1c202a]/8 text-white"
      }`}
    >
      {shortcut}
    </span>
  );
}

const Divider = () => <div className="mx-1 h-6 w-px shrink-0 bg-[#e2e5eb]" />;

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
  const [stylesOpen, setStylesOpen] = useState(false);

  useEffect(() => {
    if (!stylesOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setStylesOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [stylesOpen]);

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 px-2 lg:inset-x-auto lg:bottom-auto lg:left-1/2 lg:top-5 lg:-translate-x-1/2 lg:px-0"
      style={{
        paddingBottom: "calc(0.75rem + var(--safe-bottom))",
        paddingLeft: "calc(0.5rem + var(--safe-left))",
        paddingRight: "calc(0.5rem + var(--safe-right))",
      }}
    >
      {/* Style sheet for screens too narrow for the right-hand rail. */}
      {stylesOpen ? (
        <div className="pointer-events-auto w-full max-w-md rounded-2xl bg-white/95 p-3 shadow-[0_10px_40px_rgba(28,32,42,0.16)] ring-1 ring-black/5 backdrop-blur lg:hidden">
          <div className="mb-2 flex items-center justify-between">
            <GroupLabel>Style</GroupLabel>
            <button
              type="button"
              onClick={() => setStylesOpen(false)}
              aria-label="Close style panel"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#6b7285] transition hover:bg-[#eef0f4] hover:text-[#1c202a]"
            >
              <X size={16} strokeWidth={1.8} />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <GroupLabel>Stroke</GroupLabel>
              <div className="no-scrollbar mt-1.5 flex items-center gap-2 overflow-x-auto pb-1">
                {STROKE_COLORS.map((c) => (
                  <SwatchButton
                    key={`stroke-${c}`}
                    value={c}
                    selected={color === c}
                    label={c === TRANSPARENT ? "No stroke" : `Stroke ${c}`}
                    onSelect={onColorChange}
                    className="h-9 w-9 shrink-0"
                  />
                ))}
              </div>
            </div>

            <div>
              <GroupLabel>Fill</GroupLabel>
              <div className="no-scrollbar mt-1.5 flex items-center gap-2 overflow-x-auto pb-1">
                {FILL_COLORS.map((c) => (
                  <SwatchButton
                    key={`fill-${c}`}
                    value={c}
                    selected={fill === c}
                    label={c === TRANSPARENT ? "No fill" : `Fill ${c}`}
                    onSelect={onFillChange}
                    className="h-9 w-9 shrink-0"
                  />
                ))}
              </div>
            </div>

            <div>
              <GroupLabel>Width</GroupLabel>
              <div className="mt-1.5 flex items-center gap-2">
                {STROKE_SIZES.map((w) => (
                  <WidthButton
                    key={w}
                    width={w}
                    selected={strokeWidth === w}
                    onSelect={onStrokeWidthChange}
                    className="h-11 w-11 shrink-0"
                  />
                ))}
                <button
                  type="button"
                  onClick={() => {
                    onClear();
                    setStylesOpen(false);
                  }}
                  className="ml-auto flex h-11 items-center justify-center rounded-xl px-4 text-sm text-[#3f4555] transition hover:bg-[#eef0f4]"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Tools: a bottom dock on small screens, the top bar on desktop. */}
      <div className="pointer-events-auto flex w-full max-w-full items-center overflow-hidden rounded-2xl bg-white/95 p-1.5 shadow-[0_10px_40px_rgba(28,32,42,0.12)] ring-1 ring-black/5 backdrop-blur lg:w-auto lg:max-w-[calc(100vw_-_26rem)]">
        <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {TOOLS.map((t) => {
            const shortcut = TOOL_TO_SHORTCUT[t.id];
            const active = tool === t.id;
            return (
              <button
                key={t.id}
                type="button"
                title={`${t.label} (${shortcut})`}
                aria-label={`${t.label}, shortcut ${shortcut}`}
                aria-pressed={active}
                onClick={() => onToolChange(t.id)}
                className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base transition lg:h-10 lg:w-10 ${
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
        </div>

        {/* Style toggle stands in for the rail on small screens. */}
        <button
          type="button"
          onClick={() => setStylesOpen((v) => !v)}
          aria-label="Stroke, fill and width"
          aria-expanded={stylesOpen}
          className={`relative ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition lg:hidden ${
            stylesOpen
              ? "bg-[#1c202a] text-white"
              : "text-[#3f4555] hover:bg-[#eef0f4]"
          }`}
        >
          <SlidersHorizontal size={18} strokeWidth={1.8} />
          <span
            className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full ring-1 ring-black/15"
            style={{
              backgroundColor: color === TRANSPARENT ? "#ffffff" : color,
            }}
          />
        </button>

        <Divider />

        <button
          type="button"
          title="Undo (⌘Z)"
          aria-label="Undo, shortcut Command Z"
          onClick={onUndo}
          disabled={!canUndo}
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#3f4555] transition hover:bg-[#eef0f4] disabled:opacity-30 lg:h-10 lg:w-10"
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
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#3f4555] transition hover:bg-[#eef0f4] disabled:opacity-30 lg:h-10 lg:w-10"
        >
          <IconRedo />
          <ShortcutBadge shortcut="⇧Z" />
        </button>
        <button
          type="button"
          title="Clear"
          onClick={onClear}
          className="hidden h-10 shrink-0 items-center justify-center rounded-xl px-3 text-sm text-[#3f4555] transition hover:bg-[#eef0f4] lg:flex"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
