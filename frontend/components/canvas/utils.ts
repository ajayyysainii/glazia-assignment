import type Konva from "konva";
import type { CanvasShape, Point } from "./types";

export function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getStagePoint(stage: Konva.Stage): Point | null {
  const pointer = stage.getPointerPosition();
  if (!pointer) return null;
  const transform = stage.getAbsoluteTransform().copy().invert();
  return transform.point(pointer);
}

export function normalizeRect(x1: number, y1: number, x2: number, y2: number) {
  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  };
}

export function isShapeTooSmall(shape: CanvasShape) {
  if (shape.kind === "rect") {
    return Math.abs(shape.width) < 2 && Math.abs(shape.height) < 2;
  }
  if (shape.kind === "ellipse") {
    return shape.radiusX < 2 && shape.radiusY < 2;
  }
  if (shape.kind === "arrow") {
    return (
      Math.hypot(
        shape.points[2] - shape.points[0],
        shape.points[3] - shape.points[1],
      ) < 4
    );
  }
  return shape.points.length < 4;
}
