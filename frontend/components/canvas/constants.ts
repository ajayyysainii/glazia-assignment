import type { Tool } from "./types";

export const COLORS = [
  "#1e1e1e",
  "#e03131",
  "#2f9e44",
  "#1971c2",
  "#f08c00",
  "#9c36b5",
] as const;

export const FILL_COLORS = [
  "transparent",
  "#ffffff",
  "#ffc9c9",
  "#b2f2bb",
  "#a5d8ff",
  "#ffec99",
  "#eebefa",
] as const;

export const TRANSPARENT_FILL = "transparent";

export const STROKE_SIZES = [2, 4, 8] as const;

export const FONT_SIZES = [16, 24, 36] as const;

export const TOOL_SHORTCUTS: Record<string, Tool> = {
  "1": "select",
  "2": "hand",
  "3": "pen",
  "4": "rect",
  "5": "ellipse",
  "6": "arrow",
  "7": "text",
  "8": "eraser",
};

export const TOOL_TO_SHORTCUT: Record<Tool, string> = {
  select: "1",
  hand: "2",
  pen: "3",
  rect: "4",
  ellipse: "5",
  arrow: "6",
  text: "7",
  eraser: "8",
};

export const GRID_SIZE = 24;
export const MIN_SCALE = 0.05;
export const MAX_SCALE = 16;
export const SCALE_BY = 1.08;
export const DEFAULT_TEXT = "Text";
