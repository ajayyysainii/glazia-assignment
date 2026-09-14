"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { KonvaEventObject } from "konva/lib/Node";
import type Konva from "konva";
import { Stage, Layer, Transformer } from "react-konva";
import { CanvasBrand } from "./CanvasBrand";
import { CanvasGrid } from "./CanvasGrid";
import { CanvasToolbar } from "./CanvasToolbar";
import { COLORS, MAX_SCALE, MIN_SCALE, SCALE_BY } from "./constants";
import { useCanvasHistory } from "./hooks/useCanvasHistory";
import { useCanvasKeyboard } from "./hooks/useCanvasKeyboard";
import { ShapeNode } from "./ShapeNode";
import type { CanvasShape, LineShape, Point, Tool } from "./types";
import { getStagePoint, isShapeTooSmall, normalizeRect, uid } from "./utils";

export default function DrawingCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const shapeRefs = useRef<Record<string, Konva.Node>>({});
  const isDrawing = useRef(false);
  const isPanning = useRef(false);
  const panLast = useRef<Point | null>(null);
  const draftOrigin = useRef<Point | null>(null);
  const spaceHeld = useRef(false);

  const [size, setSize] = useState({ width: 0, height: 0 });
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState<string>(COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [draft, setDraft] = useState<CanvasShape | null>(null);

  const {
    shapes,
    setShapes,
    history,
    setHistory,
    historyIndex,
    setHistoryIndex,
    historyRef,
    historyIndexRef,
    commitShapes,
    undo,
    redo,
  } = useCanvasHistory();

  const shapesRef = useRef(shapes);
  const selectedIdRef = useRef(selectedId);
  shapesRef.current = shapes;
  selectedIdRef.current = selectedId;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      setSize({ width: el.clientWidth, height: el.clientHeight });
    };
    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useCanvasKeyboard({
    spaceHeld,
    shapesRef,
    selectedIdRef,
    historyRef,
    historyIndexRef,
    setShapes,
    setHistory,
    setHistoryIndex,
    setSelectedId,
    setTool,
  });

  useEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return;

    if (selectedId && shapeRefs.current[selectedId]) {
      tr.nodes([shapeRefs.current[selectedId]]);
      tr.getLayer()?.batchDraw();
    } else {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
    }
  }, [selectedId, shapes]);

  const clearCanvas = () => {
    commitShapes([]);
    setSelectedId(null);
  };

  const handleUndo = () => {
    undo();
    setSelectedId(null);
  };

  const handleRedo = () => {
    redo();
    setSelectedId(null);
  };

  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    let direction = e.evt.deltaY > 0 ? 1 : -1;
    if (e.evt.ctrlKey) direction = -direction;

    const newScale = Math.min(
      MAX_SCALE,
      Math.max(
        MIN_SCALE,
        direction > 0 ? oldScale / SCALE_BY : oldScale * SCALE_BY,
      ),
    );

    setStageScale(newScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const shouldPan = (evt: MouseEvent | TouchEvent) => {
    if (tool === "hand" || spaceHeld.current) return true;
    if ("button" in evt && evt.button === 1) return true;
    return false;
  };

  const handlePointerDown = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    if (shouldPan(e.evt)) {
      isPanning.current = true;
      const pos = stage.getPointerPosition();
      if (pos) panLast.current = pos;
      return;
    }

    const point = getStagePoint(stage);
    if (!point) return;

    if (tool === "select") {
      if (e.target === stage) setSelectedId(null);
      return;
    }

    setSelectedId(null);
    isDrawing.current = true;
    draftOrigin.current = point;

    if (tool === "pen" || tool === "eraser") {
      const line: LineShape = {
        id: uid(),
        kind: "line",
        tool,
        points: [point.x, point.y],
        stroke: color,
        strokeWidth: tool === "eraser" ? strokeWidth * 4 : strokeWidth,
      };
      setDraft(line);
      return;
    }

    if (tool === "rect") {
      setDraft({
        id: uid(),
        kind: "rect",
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        stroke: color,
        strokeWidth,
      });
      return;
    }

    if (tool === "ellipse") {
      setDraft({
        id: uid(),
        kind: "ellipse",
        x: point.x,
        y: point.y,
        radiusX: 0,
        radiusY: 0,
        stroke: color,
        strokeWidth,
      });
      return;
    }

    if (tool === "arrow") {
      setDraft({
        id: uid(),
        kind: "arrow",
        points: [point.x, point.y, point.x, point.y],
        stroke: color,
        strokeWidth,
      });
    }
  };

  const handlePointerMove = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    if (isPanning.current && panLast.current) {
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const dx = pos.x - panLast.current.x;
      const dy = pos.y - panLast.current.y;
      panLast.current = pos;
      setStagePos((p) => ({ x: p.x + dx, y: p.y + dy }));
      return;
    }

    if (!isDrawing.current || !draft) return;
    const point = getStagePoint(stage);
    if (!point || !draftOrigin.current) return;

    if (draft.kind === "line") {
      setDraft({
        ...draft,
        points: draft.points.concat([point.x, point.y]),
      });
      return;
    }

    if (draft.kind === "rect") {
      setDraft({
        ...draft,
        ...normalizeRect(
          draftOrigin.current.x,
          draftOrigin.current.y,
          point.x,
          point.y,
        ),
      });
      return;
    }

    if (draft.kind === "ellipse") {
      const box = normalizeRect(
        draftOrigin.current.x,
        draftOrigin.current.y,
        point.x,
        point.y,
      );
      setDraft({
        ...draft,
        x: box.x + box.width / 2,
        y: box.y + box.height / 2,
        radiusX: box.width / 2,
        radiusY: box.height / 2,
      });
      return;
    }

    if (draft.kind === "arrow") {
      setDraft({
        ...draft,
        points: [
          draftOrigin.current.x,
          draftOrigin.current.y,
          point.x,
          point.y,
        ],
      });
    }
  };

  const handlePointerUp = () => {
    isPanning.current = false;
    panLast.current = null;

    if (!isDrawing.current) return;
    isDrawing.current = false;

    if (draft) {
      if (!isShapeTooSmall(draft)) {
        commitShapes([...shapes, draft]);
      }
      setDraft(null);
    }
    draftOrigin.current = null;
  };

  const updateShape = useCallback(
    (id: string, attrs: Partial<CanvasShape>) => {
      commitShapes(
        shapes.map((s) =>
          s.id === id ? ({ ...s, ...attrs } as CanvasShape) : s,
        ),
      );
    },
    [commitShapes, shapes],
  );

  const registerRef = useCallback((id: string, node: Konva.Node | null) => {
    if (node) shapeRefs.current[id] = node;
    else delete shapeRefs.current[id];
  }, []);

  const cursorStyle: CSSProperties["cursor"] =
    tool === "hand" || spaceHeld.current
      ? "grab"
      : tool === "select"
        ? "default"
        : "crosshair";

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <CanvasGrid stageScale={stageScale} stagePos={stagePos} />
      {/* <CanvasBrand /> */}
      <CanvasToolbar
        tool={tool}
        color={color}
        strokeWidth={strokeWidth}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onToolChange={setTool}
        onColorChange={setColor}
        onStrokeWidthChange={setStrokeWidth}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={clearCanvas}
      />

      {size.width > 0 && (
        <Stage
          ref={stageRef}
          width={size.width}
          height={size.height}
          x={stagePos.x}
          y={stagePos.y}
          scaleX={stageScale}
          scaleY={stageScale}
          style={{ cursor: cursorStyle }}
          onWheel={handleWheel}
          onMouseDown={handlePointerDown}
          onMousemove={handlePointerMove}
          onMouseup={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        >
          <Layer>
            {shapes.map((shape) => (
              <ShapeNode
                key={shape.id}
                shape={shape}
                tool={tool}
                onSelect={setSelectedId}
                onChange={updateShape}
                registerRef={registerRef}
              />
            ))}
            {draft && (
              <ShapeNode
                shape={draft}
                tool={tool}
                isDraft
                onSelect={setSelectedId}
                onChange={updateShape}
                registerRef={registerRef}
              />
            )}
            <Transformer
              ref={transformerRef}
              rotateEnabled
              flipEnabled={false}
              boundBoxFunc={(oldBox, newBox) => {
                if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          </Layer>
        </Stage>
      )}
    </div>
  );
}
