import type { Tool } from "./types";

export const COLORS = [
  "#1e1e1e",
  "#e03131",
  "#2f9e44",
  "#1971c2",
  "#f08c00",
  "#9c36b5",
] as const;

export const STROKE_SIZES = [2, 4, 8] as const;

export const TOOL_SHORTCUTS: Record<string, Tool> = {
  "1": "select",
  "2": "hand",
  "3": "pen",
  "4": "rect",
  "5": "ellipse",
  "6": "arrow",
  "7": "eraser",
};

export const GRID_SIZE = 24;
export const MIN_SCALE = 0.25;
export const MAX_SCALE = 4;
export const SCALE_BY = 1.05;
