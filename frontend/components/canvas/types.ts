export type Tool =
  | "select"
  | "hand"
  | "pen"
  | "rect"
  | "ellipse"
  | "arrow"
  | "text"
  | "eraser";

export type BaseShape = {
  id: string;
  stroke: string;
  strokeWidth: number;
  /** Fill color; omit / null / "transparent" = no fill */
  fill?: string | null;
  rotation?: number;
};

export type LineShape = BaseShape & {
  kind: "line";
  tool: "pen" | "eraser";
  points: number[];
};

export type RectShape = BaseShape & {
  kind: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
};

export type EllipseShape = BaseShape & {
  kind: "ellipse";
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
};

export type ArrowShape = BaseShape & {
  kind: "arrow";
  points: number[];
};

export type TextShape = BaseShape & {
  kind: "text";
  x: number;
  y: number;
  text: string;
  fontSize: number;
  width?: number;
};

export type CanvasShape =
  | LineShape
  | RectShape
  | EllipseShape
  | ArrowShape
  | TextShape;

export type Point = { x: number; y: number };
