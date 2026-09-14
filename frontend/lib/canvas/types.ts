import type { CanvasShape } from "@/components/canvas";

export type CanvasViewport = {
  x: number;
  y: number;
  scale: number;
};

/** Geometry-only shapes used to draw dashboard thumbnails. */
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

export type CanvasSummary = {
  id: string;
  owner: string;
  title: string;
  shapeCount: number;
  viewport: CanvasViewport;
  preview?: PreviewShape[];
  previewBounds?: PreviewBounds | null;
  previewTruncated?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CanvasDocument = {
  id: string;
  owner: string;
  title: string;
  shapes: CanvasShape[];
  viewport: CanvasViewport;
  createdAt?: string;
  updatedAt?: string;
};

export type CanvasSnapshot = {
  title?: string;
  shapes: CanvasShape[];
  viewport: CanvasViewport;
};
