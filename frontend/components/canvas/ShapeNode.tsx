"use client";

import type Konva from "konva";
import { Arrow, Ellipse, Line, Rect } from "react-konva";
import type { CanvasShape, Tool } from "./types";

type ShapeNodeProps = {
  shape: CanvasShape;
  tool: Tool;
  isDraft?: boolean;
  onSelect: (id: string) => void;
  onChange: (id: string, attrs: Partial<CanvasShape>) => void;
  registerRef: (id: string, node: Konva.Node | null) => void;
};

export function ShapeNode({
  shape,
  tool,
  isDraft = false,
  onSelect,
  onChange,
  registerRef,
}: ShapeNodeProps) {
  const common = {
    stroke: shape.stroke,
    strokeWidth: shape.strokeWidth,
    perfectDrawEnabled: false,
    listening: !isDraft && tool === "select",
    draggable: !isDraft && tool === "select",
    onClick: () => {
      if (tool === "select") onSelect(shape.id);
    },
    onTap: () => {
      if (tool === "select") onSelect(shape.id);
    },
    ref: (node: Konva.Node | null) => {
      if (!isDraft) registerRef(shape.id, node);
    },
  };

  if (shape.kind === "line") {
    return (
      <Line
        key={shape.id}
        {...common}
        points={shape.points}
        tension={0.45}
        lineCap="round"
        lineJoin="round"
        globalCompositeOperation={
          shape.tool === "eraser" ? "destination-out" : "source-over"
        }
        draggable={false}
        listening={false}
      />
    );
  }

  if (shape.kind === "rect") {
    return (
      <Rect
        key={shape.id}
        {...common}
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        cornerRadius={8}
        fillEnabled={false}
        onDragEnd={(e) => {
          onChange(shape.id, { x: e.target.x(), y: e.target.y() });
        }}
        onTransformEnd={(e) => {
          const node = e.target;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange(shape.id, {
            x: node.x(),
            y: node.y(),
            width: Math.max(4, node.width() * scaleX),
            height: Math.max(4, node.height() * scaleY),
          });
        }}
      />
    );
  }

  if (shape.kind === "ellipse") {
    return (
      <Ellipse
        key={shape.id}
        {...common}
        x={shape.x}
        y={shape.y}
        radiusX={shape.radiusX}
        radiusY={shape.radiusY}
        fillEnabled={false}
        onDragEnd={(e) => {
          onChange(shape.id, { x: e.target.x(), y: e.target.y() });
        }}
        onTransformEnd={(e) => {
          const node = e.target;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange(shape.id, {
            x: node.x(),
            y: node.y(),
            radiusX: Math.max(4, (node as Konva.Ellipse).radiusX() * scaleX),
            radiusY: Math.max(4, (node as Konva.Ellipse).radiusY() * scaleY),
          });
        }}
      />
    );
  }

  return (
    <Arrow
      key={shape.id}
      {...common}
      points={shape.points}
      pointerLength={12}
      pointerWidth={12}
      lineCap="round"
      lineJoin="round"
      fill={shape.stroke}
      onDragEnd={(e) => {
        const node = e.target;
        const dx = node.x();
        const dy = node.y();
        node.position({ x: 0, y: 0 });
        onChange(shape.id, {
          points: shape.points.map((v, i) => (i % 2 === 0 ? v + dx : v + dy)),
        });
      }}
    />
  );
}
