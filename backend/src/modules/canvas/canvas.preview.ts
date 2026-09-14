/**
 * Compact board previews for the dashboard.
 *
 * The list query already reads every shape (it counts them), so deriving a
 * thumbnail payload here costs no extra database work — only response bytes,
 * which the caps below keep small.
 */

const MAX_PREVIEW_SHAPES = 140;
const MAX_POINTS_PER_LINE = 40;

export type PreviewShape =
  | {
      kind: "line" | "arrow";
      points: number[];
      stroke: string;
      strokeWidth: number;
    }
  | {
      kind: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      stroke: string;
      strokeWidth: number;
      fill?: string | null;
    }
  | {
      kind: "ellipse";
      x: number;
      y: number;
      radiusX: number;
      radiusY: number;
      stroke: string;
      strokeWidth: number;
      fill?: string | null;
    }
  | {
      kind: "text";
      x: number;
      y: number;
      fontSize: number;
      width?: number;
      stroke: string;
    };

export type PreviewBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

type Rec = Record<string, unknown>;

const num = (value: unknown, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const str = (value: unknown, fallback: string) =>
  typeof value === "string" ? value : fallback;

/** Keep the silhouette of a freehand stroke without shipping every sample. */
function thinPoints(points: number[]) {
  const pairs = Math.floor(points.length / 2);
  if (pairs <= MAX_POINTS_PER_LINE) return points.slice(0, pairs * 2);

  const step = Math.ceil(pairs / MAX_POINTS_PER_LINE);
  const out: number[] = [];
  for (let i = 0; i < pairs; i += step) {
    out.push(points[i * 2]!, points[i * 2 + 1]!);
  }
  // Always finish on the real last point so the stroke ends where it ended.
  const lastX = points[(pairs - 1) * 2]!;
  const lastY = points[(pairs - 1) * 2 + 1]!;
  if (out[out.length - 2] !== lastX || out[out.length - 1] !== lastY) {
    out.push(lastX, lastY);
  }
  return out;
}

function toPreviewShape(raw: unknown): PreviewShape | null {
  if (!raw || typeof raw !== "object") return null;
  const shape = raw as Rec;
  const stroke = str(shape.stroke, "#1e1e1e");
  const strokeWidth = num(shape.strokeWidth, 2);

  switch (shape.kind) {
    case "line":
    case "arrow": {
      if (!Array.isArray(shape.points) || shape.points.length < 4) return null;
      const points = (shape.points as unknown[]).filter(
        (p): p is number => typeof p === "number" && Number.isFinite(p),
      );
      if (points.length < 4) return null;
      return {
        kind: shape.kind,
        points: shape.kind === "arrow" ? points.slice(0, 4) : thinPoints(points),
        stroke,
        strokeWidth,
      };
    }
    case "rect":
      return {
        kind: "rect",
        x: num(shape.x),
        y: num(shape.y),
        width: num(shape.width),
        height: num(shape.height),
        stroke,
        strokeWidth,
        fill: typeof shape.fill === "string" ? shape.fill : null,
      };
    case "ellipse":
      return {
        kind: "ellipse",
        x: num(shape.x),
        y: num(shape.y),
        radiusX: num(shape.radiusX),
        radiusY: num(shape.radiusY),
        stroke,
        strokeWidth,
        fill: typeof shape.fill === "string" ? shape.fill : null,
      };
    case "text":
      // Glyphs are illegible at thumbnail scale, so only the block is kept —
      // which also keeps note contents out of the list response.
      return {
        kind: "text",
        x: num(shape.x),
        y: num(shape.y),
        fontSize: num(shape.fontSize, 16),
        width: typeof shape.width === "number" ? shape.width : undefined,
        stroke,
      };
    default:
      return null;
  }
}

function growBounds(bounds: PreviewBounds, x: number, y: number) {
  bounds.minX = Math.min(bounds.minX, x);
  bounds.minY = Math.min(bounds.minY, y);
  bounds.maxX = Math.max(bounds.maxX, x);
  bounds.maxY = Math.max(bounds.maxY, y);
}

function accumulate(bounds: PreviewBounds, shape: PreviewShape) {
  switch (shape.kind) {
    case "line":
    case "arrow":
      for (let i = 0; i < shape.points.length; i += 2) {
        growBounds(bounds, shape.points[i]!, shape.points[i + 1]!);
      }
      return;
    case "rect":
      growBounds(bounds, shape.x, shape.y);
      growBounds(bounds, shape.x + shape.width, shape.y + shape.height);
      return;
    case "ellipse":
      growBounds(bounds, shape.x - shape.radiusX, shape.y - shape.radiusY);
      growBounds(bounds, shape.x + shape.radiusX, shape.y + shape.radiusY);
      return;
    case "text":
      growBounds(bounds, shape.x, shape.y);
      growBounds(
        bounds,
        shape.x + (shape.width ?? shape.fontSize * 6),
        shape.y + shape.fontSize * 1.4,
      );
  }
}

/**
 * Bounds are measured over every shape, so a truncated preview still sits in
 * the right place on the board.
 */
export function buildPreview(shapes: unknown[]) {
  const bounds: PreviewBounds = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  };

  const preview: PreviewShape[] = [];
  let measured = 0;

  for (const raw of shapes) {
    const shape = toPreviewShape(raw);
    if (!shape) continue;
    accumulate(bounds, shape);
    measured += 1;
    if (preview.length < MAX_PREVIEW_SHAPES) preview.push(shape);
  }

  if (measured === 0) {
    return { preview: [], bounds: null, previewTruncated: false };
  }

  return {
    preview,
    bounds,
    previewTruncated: preview.length < measured,
  };
}
