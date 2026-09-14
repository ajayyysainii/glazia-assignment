import type { CanvasShape } from "@/components/canvas";

export type CanvasViewport = {
  x: number;
  y: number;
  scale: number;
};

export type CanvasSummary = {
  id: string;
  owner: string;
  title: string;
  shapeCount: number;
  viewport: CanvasViewport;
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
