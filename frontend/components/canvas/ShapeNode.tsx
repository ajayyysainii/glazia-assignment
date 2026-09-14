"use client";

import type Konva from "konva";
import { Arrow, Ellipse, Line, Rect, Text } from "react-konva";
import { TRANSPARENT_FILL } from "./constants";
import type { CanvasShape, Tool } from "./types";

type ShapeNodeProps = {
  shape: CanvasShape;
  tool: Tool;
  isDraft?: boolean;
  isEditing?: boolean;
  onSelect: (id: string) => void;
  onEditText?: (id: string) => void;
  onChange: (id: string, attrs: Partial<CanvasShape>) => void;
  registerRef: (id: string, node: Konva.Node | null) => void;
};

function resolveFill(fill?: string | null) {
  if (!fill || fill === TRANSPARENT_FILL) {
    return { fillEnabled: false as const, fill: undefined };
  }
  return { fillEnabled: true as const, fill };
}

export function ShapeNode({
  shape,
  tool,
  isDraft = false,
  isEditing = false,
  onSelect,
  onEditText,
  onChange,
  registerRef,
}: ShapeNodeProps) {
  const selectable = !isDraft && tool === "select";

  const common = {
    rotation: shape.rotation ?? 0,
    stroke: shape.stroke,
    strokeWidth: shape.strokeWidth,
    perfectDrawEnabled: false,
    listening: selectable,
    draggable: selectable,
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
    const fillProps = resolveFill(shape.fill);
    return (
      <Rect
        key={shape.id}
        {...common}
        {...fillProps}
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        cornerRadius={8}
        onDragEnd={(e) => {
          onChange(shape.id, {
            x: e.target.x(),
            y: e.target.y(),
            rotation: e.target.rotation(),
          });
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
            rotation: node.rotation(),
            width: Math.max(4, node.width() * scaleX),
            height: Math.max(4, node.height() * scaleY),
          });
        }}
      />
    );
  }

  if (shape.kind === "ellipse") {
    const fillProps = resolveFill(shape.fill);
    return (
      <Ellipse
        key={shape.id}
        {...common}
        {...fillProps}
        x={shape.x}
        y={shape.y}
        radiusX={shape.radiusX}
        radiusY={shape.radiusY}
        onDragEnd={(e) => {
          onChange(shape.id, {
            x: e.target.x(),
            y: e.target.y(),
            rotation: e.target.rotation(),
          });
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
            rotation: node.rotation(),
            radiusX: Math.max(4, (node as Konva.Ellipse).radiusX() * scaleX),
            radiusY: Math.max(4, (node as Konva.Ellipse).radiusY() * scaleY),
          });
        }}
      />
    );
  }

  if (shape.kind === "text") {
    return (
      <Text
        key={shape.id}
        {...common}
        x={shape.x}
        y={shape.y}
        text={shape.text}
        fontSize={shape.fontSize}
        fontFamily="Geist, sans-serif"
        fill={shape.stroke}
        strokeEnabled={false}
        width={shape.width}
        opacity={isEditing ? 0 : 1}
        onDblClick={() => onEditText?.(shape.id)}
        onDblTap={() => onEditText?.(shape.id)}
        onDragEnd={(e) => {
          onChange(shape.id, {
            x: e.target.x(),
            y: e.target.y(),
            rotation: e.target.rotation(),
          });
        }}
        onTransformEnd={(e) => {
          const node = e.target as Konva.Text;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange(shape.id, {
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            fontSize: Math.max(10, shape.fontSize * scaleY),
            width: Math.max(40, node.width() * scaleX),
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
          rotation: node.rotation(),
        });
      }}
      onTransformEnd={(e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        const rotation = node.rotation();
        node.scaleX(1);
        node.scaleY(1);

        const [x1, y1, x2, y2] = shape.points;
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        const scaled = shape.points.map((v, i) => {
          if (i % 2 === 0) return cx + (v - cx) * scaleX;
          return cy + (v - cy) * scaleY;
        });

        node.position({ x: 0, y: 0 });
        onChange(shape.id, {
          points: scaled,
          rotation,
        });
      }}
    />
  );
}
