import type { CanvasShape } from "./types";

export type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

/** Axis-aligned extent of one shape, ignoring its rotation. */
export function shapeBounds(shape: CanvasShape): Bounds | null {
  switch (shape.kind) {
    case "line":
    case "arrow": {
      const { points } = shape;
      if (points.length < 2) return null;
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (let i = 0; i < points.length; i += 2) {
        minX = Math.min(minX, points[i]!);
        maxX = Math.max(maxX, points[i]!);
        minY = Math.min(minY, points[i + 1]!);
        maxY = Math.max(maxY, points[i + 1]!);
      }
      return { minX, minY, maxX, maxY };
    }
    case "rect":
      return {
        minX: Math.min(shape.x, shape.x + shape.width),
        minY: Math.min(shape.y, shape.y + shape.height),
        maxX: Math.max(shape.x, shape.x + shape.width),
        maxY: Math.max(shape.y, shape.y + shape.height),
      };
    case "ellipse":
      return {
        minX: shape.x - Math.abs(shape.radiusX),
        minY: shape.y - Math.abs(shape.radiusY),
        maxX: shape.x + Math.abs(shape.radiusX),
        maxY: shape.y + Math.abs(shape.radiusY),
      };
    case "text":
      return {
        minX: shape.x,
        minY: shape.y,
        maxX: shape.x + (shape.width ?? shape.fontSize * 6),
        maxY: shape.y + shape.fontSize * 1.4,
      };
    default:
      return null;
  }
}

/** Extent covering every shape, or null for an empty board. */
export function boardBounds(shapes: CanvasShape[]): Bounds | null {
  let acc: Bounds | null = null;
  for (const shape of shapes) {
    const b = shapeBounds(shape);
    if (!b) continue;
    acc = acc
      ? {
          minX: Math.min(acc.minX, b.minX),
          minY: Math.min(acc.minY, b.minY),
          maxX: Math.max(acc.maxX, b.maxX),
          maxY: Math.max(acc.maxY, b.maxY),
        }
      : b;
  }
  // Stroke width bleeds past geometry; a little slack keeps edges intact.
  if (!acc) return null;
  return acc;
}

/** Move a points-based shape so its top-left lands on (x, y). */
export function translatePoints(points: number[], dx: number, dy: number) {
  const next = [...points];
  for (let i = 0; i < next.length; i += 2) {
    next[i] = next[i]! + dx;
    next[i + 1] = next[i + 1]! + dy;
  }
  return next;
}
