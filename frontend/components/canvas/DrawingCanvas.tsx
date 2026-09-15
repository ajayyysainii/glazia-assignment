"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { KonvaEventObject } from "konva/lib/Node";
import type Konva from "konva";
import { Stage, Layer, Transformer } from "react-konva";
import type { CanvasViewport } from "@/lib/canvas";
import { CanvasGrid } from "./CanvasGrid";
import { CanvasInspector, type LayerMove } from "./CanvasInspector";
import { CanvasPalette } from "./CanvasPalette";
import { CanvasToolbar } from "./CanvasToolbar";
import { ZoomHud } from "./ZoomHud";
import {
  COLORS,
  DEFAULT_TEXT,
  FONT_SIZES,
  MAX_SCALE,
  MIN_SCALE,
  SCALE_BY,
  TRANSPARENT,
} from "./constants";
import { useCanvasHistory } from "./hooks/useCanvasHistory";
import { useCanvasKeyboard } from "./hooks/useCanvasKeyboard";
import { useCoarsePointer } from "./hooks/useMediaQuery";
import { ShapeNode } from "./ShapeNode";
import { TextEditor } from "./TextEditor";
import type { CanvasShape, LineShape, Point, TextShape, Tool } from "./types";
import { getStagePoint, isShapeTooSmall, normalizeRect, uid } from "./utils";
import { boardBounds } from "./utils.bounds";

export type DrawingCanvasHandle = {
  getSnapshot: () => {
    shapes: CanvasShape[];
    viewport: CanvasViewport;
  };
  loadDocument: (doc: {
    shapes: CanvasShape[];
    viewport: CanvasViewport;
  }) => void;
  clearLocal: () => void;
  /** Mark board clean against a specific snapshot (defaults to current). */
  markClean: (doc?: {
    shapes: CanvasShape[];
    viewport: CanvasViewport;
  }) => void;
  /**
   * Render the drawn content to a PNG data URL, cropped to the content's
   * own bounds rather than the current viewport. Returns null for an
   * empty board.
   */
  exportPNG: (options?: { pixelRatio?: number }) => Promise<string | null>;
};

type DrawingCanvasProps = {
  initialShapes?: CanvasShape[];
  initialViewport?: CanvasViewport;
  onDirtyChange?: (dirty: boolean) => void;
  /** Fires when the board goes from having shapes to having none, or back. */
  onEmptyChange?: (empty: boolean) => void;
  /** Rendered directly beneath the palette in the right-hand rail. */
  railFooter?: ReactNode;
};

const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  function DrawingCanvas(
    {
      initialShapes = [],
      initialViewport = { x: 0, y: 0, scale: 1 },
      onDirtyChange,
      onEmptyChange,
      railFooter,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<Konva.Stage>(null);
    const transformerRef = useRef<Konva.Transformer>(null);
    const shapeRefs = useRef<Record<string, Konva.Node>>({});
    const isDrawing = useRef(false);
    const isPanning = useRef(false);
    const panLast = useRef<Point | null>(null);
    const draftOrigin = useRef<Point | null>(null);
    /** Pinch/two-finger gesture state, in container-relative pixels. */
    const gesture = useRef<{ dist: number; center: Point } | null>(null);
    /** Ignore single-finger drawing until every finger has left the glass. */
    const suppressDraw = useRef(false);
    const spaceHeld = useRef(false);
    const [spaceDown, setSpaceDown] = useState(false);
    const [panning, setPanning] = useState(false);
    const baselineRef = useRef(
      JSON.stringify({ shapes: initialShapes, viewport: initialViewport }),
    );

    const [size, setSize] = useState({ width: 0, height: 0 });
    const [tool, setTool] = useState<Tool>("pen");
    const [color, setColor] = useState<string>(COLORS[0]);
    const [fill, setFill] = useState<string>(TRANSPARENT);
    const [strokeWidth, setStrokeWidth] = useState(4);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editingTextId, setEditingTextId] = useState<string | null>(null);
    const [stagePos, setStagePos] = useState({
      x: initialViewport.x,
      y: initialViewport.y,
    });
    const [stageScale, setStageScale] = useState(initialViewport.scale);
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

    // Touch moves can fire several times per frame, faster than state settles.
    const viewRef = useRef({ pos: stagePos, scale: stageScale });
    viewRef.current = { pos: stagePos, scale: stageScale };

    const coarsePointer = useCoarsePointer();

    const editingText = shapes.find(
      (s): s is TextShape => s.kind === "text" && s.id === editingTextId,
    );

    const selectedShape = selectedId
      ? shapes.find((s) => s.id === selectedId)
      : undefined;

    // Load initial document once on mount
    useEffect(() => {
      setShapes(initialShapes);
      setHistory([initialShapes]);
      setHistoryIndex(0);
      setStagePos({ x: initialViewport.x, y: initialViewport.y });
      setStageScale(initialViewport.scale);
      baselineRef.current = JSON.stringify({
        shapes: initialShapes,
        viewport: initialViewport,
      });
      onDirtyChange?.(false);
      // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only seed
    }, []);

    useEffect(() => {
      const snapshot = JSON.stringify({
        shapes,
        viewport: { x: stagePos.x, y: stagePos.y, scale: stageScale },
      });
      onDirtyChange?.(snapshot !== baselineRef.current);
      onEmptyChange?.(shapes.length === 0);
    }, [shapes, stagePos, stageScale, onDirtyChange, onEmptyChange]);

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
      onSpaceChange: setSpaceDown,
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

      if (selectedId && !editingTextId && shapeRefs.current[selectedId]) {
        tr.nodes([shapeRefs.current[selectedId]]);
        tr.getLayer()?.batchDraw();
      } else {
        tr.nodes([]);
        tr.getLayer()?.batchDraw();
      }
    }, [selectedId, shapes, editingTextId]);

    const markSaved = useCallback(
      (doc: { shapes: CanvasShape[]; viewport: CanvasViewport }) => {
        baselineRef.current = JSON.stringify(doc);
        onDirtyChange?.(false);
      },
      [onDirtyChange],
    );

    useImperativeHandle(
      ref,
      () => ({
        getSnapshot: () => ({
          shapes,
          viewport: { x: stagePos.x, y: stagePos.y, scale: stageScale },
        }),
        loadDocument: (doc) => {
          setShapes(doc.shapes);
          setHistory([doc.shapes]);
          setHistoryIndex(0);
          setStagePos({ x: doc.viewport.x, y: doc.viewport.y });
          setStageScale(doc.viewport.scale);
          setSelectedId(null);
          setEditingTextId(null);
          setDraft(null);
          markSaved(doc);
        },
        clearLocal: () => {
          setShapes([]);
          setHistory([[]]);
          setHistoryIndex(0);
          setStagePos({ x: 0, y: 0 });
          setStageScale(1);
          setSelectedId(null);
          setEditingTextId(null);
          setDraft(null);
          markSaved({
            shapes: [],
            viewport: { x: 0, y: 0, scale: 1 },
          });
        },
        markClean: (doc) => {
          markSaved(
            doc ?? {
              shapes,
              viewport: { x: stagePos.x, y: stagePos.y, scale: stageScale },
            },
          );
        },
        exportPNG: async ({ pixelRatio = 2 } = {}) => {
          const stage = stageRef.current;
          const bounds = boardBounds(shapes);
          if (!stage || !bounds) return null;

          const pad = 24;
          const width = Math.max(1, bounds.maxX - bounds.minX) + pad * 2;
          const height = Math.max(1, bounds.maxY - bounds.minY) + pad * 2;

          // Neutralise the viewport transform so the crop rect is simply
          // [0, width] x [0, height]; Konva re-renders into a fresh canvas,
          // so content scrolled off-screen is still captured. Restored
          // immediately afterwards, before React paints again.
          const previous = {
            x: stage.x(),
            y: stage.y(),
            scale: stage.scaleX(),
          };
          const transformer = transformerRef.current;
          transformer?.visible(false);
          stage.position({ x: -bounds.minX + pad, y: -bounds.minY + pad });
          stage.scale({ x: 1, y: 1 });
          stage.draw();

          let raw: string;
          try {
            raw = stage.toDataURL({
              x: 0,
              y: 0,
              width,
              height,
              pixelRatio,
            });
          } finally {
            stage.position({ x: previous.x, y: previous.y });
            stage.scale({ x: previous.scale, y: previous.scale });
            transformer?.visible(true);
            stage.draw();
          }

          // Konva exports a transparent background; flatten onto white so the
          // file looks like the board rather than a floating sketch.
          return new Promise<string | null>((resolve) => {
            const image = new window.Image();
            image.onload = () => {
              const canvas = document.createElement("canvas");
              canvas.width = image.width;
              canvas.height = image.height;
              const ctx = canvas.getContext("2d");
              if (!ctx) return resolve(raw);
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(image, 0, 0);
              resolve(canvas.toDataURL("image/png"));
            };
            image.onerror = () => resolve(raw);
            image.src = raw;
          });
        },
      }),
      [shapes, stagePos, stageScale, markSaved, setShapes, setHistory, setHistoryIndex],
    );
    const clearCanvas = () => {
      commitShapes([]);
      setSelectedId(null);
      setEditingTextId(null);
    };

    const handleUndo = () => {
      undo();
      setSelectedId(null);
      setEditingTextId(null);
    };

    const handleRedo = () => {
      redo();
      setSelectedId(null);
      setEditingTextId(null);
    };

    const zoomAtPoint = useCallback(
      (pointer: Point, nextScale: number) => {
        const stage = stageRef.current;
        if (!stage) return;

        const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
        const oldScale = stageScale;
        if (clamped === oldScale) return;

        const mousePointTo = {
          x: (pointer.x - stagePos.x) / oldScale,
          y: (pointer.y - stagePos.y) / oldScale,
        };

        setStageScale(clamped);
        setStagePos({
          x: pointer.x - mousePointTo.x * clamped,
          y: pointer.y - mousePointTo.y * clamped,
        });
      },
      [stagePos.x, stagePos.y, stageScale],
    );

    const zoomByFactor = useCallback(
      (factor: number) => {
        const stage = stageRef.current;
        if (!stage) return;
        const pointer = {
          x: stage.width() / 2,
          y: stage.height() / 2,
        };
        zoomAtPoint(pointer, stageScale * factor);
      },
      [stageScale, zoomAtPoint],
    );

    const resetView = useCallback(() => {
      setStagePos({ x: 0, y: 0 });
      setStageScale(1);
    }, []);

    const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage || editingTextId) return;

      const { ctrlKey, metaKey, deltaX, deltaY } = e.evt;
      const isZoomGesture = ctrlKey || metaKey;

      // Trackpad scroll / mouse wheel → pan the infinite plane
      if (!isZoomGesture) {
        setStagePos((pos) => ({
          x: pos.x - deltaX,
          y: pos.y - deltaY,
        }));
        return;
      }

      // Pinch / Ctrl+wheel → zoom toward pointer
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const intensity = Math.min(Math.abs(deltaY) / 100, 2.5);
      const zoomFactor = Math.pow(SCALE_BY, intensity);
      const nextScale =
        deltaY > 0 ? stageScale / zoomFactor : stageScale * zoomFactor;
      zoomAtPoint(pointer, nextScale);
    };

    /** Touch coordinates relative to the stage container. */
    const touchPoints = (evt: TouchEvent): Point[] => {
      const stage = stageRef.current;
      if (!stage) return [];
      const rect = stage.container().getBoundingClientRect();
      return Array.from(evt.touches).map((t) => ({
        x: t.clientX - rect.left,
        y: t.clientY - rect.top,
      }));
    };

    const midpoint = (a: Point, b: Point): Point => ({
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
    });

    const distance = (a: Point, b: Point) =>
      Math.hypot(a.x - b.x, a.y - b.y);

    const isTouchEvent = (evt: MouseEvent | TouchEvent): evt is TouchEvent =>
      "touches" in evt;

    const isMultiTouch = (evt: MouseEvent | TouchEvent) =>
      isTouchEvent(evt) && evt.touches.length >= 2;

    /** Pinch to zoom and two-finger drag to pan, the standard touch pair. */
    const handleGesture = (evt: TouchEvent) => {
      const [a, b] = touchPoints(evt);
      if (!a || !b) return;

      const dist = distance(a, b);
      const center = midpoint(a, b);
      const previous = gesture.current;
      gesture.current = { dist, center };
      if (!previous || previous.dist === 0) return;

      const { pos, scale } = viewRef.current;
      const nextScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, scale * (dist / previous.dist)),
      );

      // Keep the content under the pinch centre pinned to the fingers, so the
      // same gesture zooms and pans at once.
      const pointTo = {
        x: (previous.center.x - pos.x) / scale,
        y: (previous.center.y - pos.y) / scale,
      };
      const nextPos = {
        x: center.x - pointTo.x * nextScale,
        y: center.y - pointTo.y * nextScale,
      };

      viewRef.current = { pos: nextPos, scale: nextScale };
      setStageScale(nextScale);
      setStagePos(nextPos);
    };

    /** Drop anything half-drawn when a gesture takes over. */
    const cancelInteraction = () => {
      isDrawing.current = false;
      isPanning.current = false;
      panLast.current = null;
      draftOrigin.current = null;
      setPanning(false);
      setDraft(null);
    };

    const shouldPan = (evt: MouseEvent | TouchEvent) => {
      if (tool === "hand" || spaceHeld.current) return true;
      if ("button" in evt && evt.button === 1) return true;
      return false;
    };

    const placeText = (point: Point) => {
      const id = uid();
      const textShape: TextShape = {
        id,
        kind: "text",
        x: point.x,
        y: point.y,
        text: DEFAULT_TEXT,
        fontSize: FONT_SIZES[1],
        width: 220,
        stroke: color,
        strokeWidth: 0,
        rotation: 0,
      };
      commitShapes([...shapes, textShape]);
      setSelectedId(id);
      setEditingTextId(id);
      setTool("select");
    };

    const handlePointerDown = (
      e: KonvaEventObject<MouseEvent | TouchEvent>,
    ) => {
      if (editingTextId) return;

      const stage = stageRef.current;
      if (!stage) return;

      if (isTouchEvent(e.evt) && isMultiTouch(e.evt)) {
        e.evt.preventDefault();
        suppressDraw.current = true;
        cancelInteraction();
        const [a, b] = touchPoints(e.evt);
        gesture.current = a && b
          ? { dist: distance(a, b), center: midpoint(a, b) }
          : null;
        return;
      }

      // A fresh single-finger touchstart means the glass was empty a moment
      // ago, so any earlier gesture is definitively over. Relying only on
      // touchend to re-arm drawing leaves the canvas dead if the browser
      // drops that event (it does, e.g. when a gesture is interrupted).
      if (isTouchEvent(e.evt) && e.evt.touches.length === 1) {
        suppressDraw.current = false;
        gesture.current = null;
      }

      // A finger returning mid-gesture must not start a stray stroke.
      if (suppressDraw.current) return;

      if (shouldPan(e.evt)) {
        isPanning.current = true;
        setPanning(true);
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

      if (tool === "text") {
        placeText(point);
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
          rotation: 0,
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
          fill: fill === TRANSPARENT ? null : fill,
          rotation: 0,
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
          fill: fill === TRANSPARENT ? null : fill,
          rotation: 0,
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
          rotation: 0,
        });
      }
    };

    const handlePointerMove = (
      e: KonvaEventObject<MouseEvent | TouchEvent>,
    ) => {
      const stage = stageRef.current;
      if (!stage) return;

      if (isTouchEvent(e.evt) && isMultiTouch(e.evt)) {
        e.evt.preventDefault();
        handleGesture(e.evt);
        return;
      }

      if (suppressDraw.current) return;

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

    const handlePointerUp = (
      e?: KonvaEventObject<MouseEvent | TouchEvent>,
    ) => {
      const evt = e?.evt;
      if (evt && isTouchEvent(evt)) {
        gesture.current = null;
        // Only re-arm drawing once the last finger is up.
        if (evt.touches.length > 0) return;
        suppressDraw.current = false;
      }

      isPanning.current = false;
      setPanning(false);
      panLast.current = null;

      if (!isDrawing.current) return;
      isDrawing.current = false;

      if (draft) {
        if (!isShapeTooSmall(draft)) {
          commitShapes([...shapes, draft]);
          if (draft.kind !== "line") {
            setSelectedId(draft.id);
            setTool("select");
          }
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

    const applyStrokeToSelection = useCallback(
      (nextColor: string) => {
        setColor(nextColor);
        if (!selectedId) return;
        const selected = shapes.find((s) => s.id === selectedId);
        if (!selected || selected.kind === "line") return;
        updateShape(selectedId, { stroke: nextColor });
      },
      [selectedId, shapes, updateShape],
    );

    const applyFillToSelection = useCallback(
      (nextFill: string) => {
        setFill(nextFill);
        if (!selectedId) return;
        const selected = shapes.find((s) => s.id === selectedId);
        if (!selected || (selected.kind !== "rect" && selected.kind !== "ellipse")) {
          return;
        }
        updateShape(selectedId, {
          fill: nextFill === TRANSPARENT ? null : nextFill,
        });
      },
      [selectedId, shapes, updateShape],
    );

    const applyStrokeWidthToSelection = useCallback(
      (nextWidth: number) => {
        setStrokeWidth(nextWidth);
        if (!selectedId) return;
        const selected = shapes.find((s) => s.id === selectedId);
        if (!selected || selected.kind === "text") return;
        updateShape(selectedId, { strokeWidth: nextWidth });
      },
      [selectedId, shapes, updateShape],
    );

    const deleteShape = useCallback(
      (id: string) => {
        commitShapes(shapesRef.current.filter((s) => s.id !== id));
        setSelectedId(null);
        setEditingTextId(null);
      },
      [commitShapes],
    );

    /** Array order *is* z-order, so layering is a reorder. */
    const moveShapeLayer = useCallback(
      (id: string, move: LayerMove) => {
        const current = shapesRef.current;
        const from = current.findIndex((s) => s.id === id);
        if (from === -1) return;

        const to =
          move === "front"
            ? current.length - 1
            : move === "back"
              ? 0
              : move === "forward"
                ? Math.min(current.length - 1, from + 1)
                : Math.max(0, from - 1);
        if (to === from) return;

        const next = [...current];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved!);
        commitShapes(next);
      },
      [commitShapes],
    );

    const registerRef = useCallback((id: string, node: Konva.Node | null) => {
      if (node) shapeRefs.current[id] = node;
      else delete shapeRefs.current[id];
    }, []);

    const cursorStyle: CSSProperties["cursor"] =
      panning || tool === "hand" || spaceDown
        ? panning
          ? "grabbing"
          : "grab"
        : tool === "select"
          ? "default"
          : tool === "text"
            ? "text"
            : "crosshair";

    const inspectorPanel =
      selectedShape && !editingTextId ? (
        <CanvasInspector
          // Remount on selection change so a half-typed value can never
          // linger in the fields showing a number the shape doesn't have.
          key={selectedShape.id}
          shape={selectedShape}
          onChange={updateShape}
          onDelete={deleteShape}
          onLayerMove={moveShapeLayer}
        />
      ) : null;

    return (
      <div
        ref={containerRef}
        className="relative h-full w-full overflow-clip overscroll-none touch-none"
        style={{ overscrollBehavior: "none" }}
      >
        <CanvasGrid stageScale={stageScale} stagePos={stagePos} />
        <CanvasToolbar
          inspector={inspectorPanel}
          tool={tool}
          color={color}
          fill={fill}
          strokeWidth={strokeWidth}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onToolChange={(next) => {
            setEditingTextId(null);
            setTool(next);
          }}
          onColorChange={applyStrokeToSelection}
          onFillChange={applyFillToSelection}
          onStrokeWidthChange={applyStrokeWidthToSelection}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={clearCanvas}
        />

        {/* Right-hand rail: properties, then whatever the workspace stacks
            under them. A column keeps the footer glued below the palette as
            it grows or scrolls. */}
        <div
          className="no-scrollbar absolute right-5 top-[5.75rem] z-40 hidden max-h-[calc(100dvh_-_8.5rem)] w-52 flex-col items-stretch gap-2 overflow-y-auto overscroll-contain lg:flex"
          style={{ marginRight: "var(--safe-right)" }}
        >
          {selectedShape && !editingTextId ? (
            <CanvasInspector
              shape={selectedShape}
              onChange={updateShape}
              onDelete={deleteShape}
              onLayerMove={moveShapeLayer}
            />
          ) : null}

          <CanvasPalette
            color={color}
            fill={fill}
            strokeWidth={strokeWidth}
            onColorChange={applyStrokeToSelection}
            onFillChange={applyFillToSelection}
            onStrokeWidthChange={applyStrokeWidthToSelection}
          />
          {railFooter}
        </div>

        <ZoomHud
          scale={stageScale}
          onZoomIn={() => zoomByFactor(SCALE_BY)}
          onZoomOut={() => zoomByFactor(1 / SCALE_BY)}
          onResetView={resetView}
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
                  isEditing={shape.id === editingTextId}
                  onSelect={setSelectedId}
                  onEditText={setEditingTextId}
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
                // Fingers need larger handles, and fewer of them to aim at.
                anchorSize={coarsePointer ? 16 : 10}
                anchorCornerRadius={coarsePointer ? 8 : 4}
                rotateAnchorOffset={coarsePointer ? 34 : 20}
                enabledAnchors={
                  editingText
                    ? []
                    : coarsePointer
                      ? [
                          "top-left",
                          "top-right",
                          "bottom-left",
                          "bottom-right",
                        ]
                      : [
                          "top-left",
                          "top-right",
                          "bottom-left",
                          "bottom-right",
                          "middle-left",
                          "middle-right",
                          "top-center",
                          "bottom-center",
                        ]
                }
                flipEnabled={false}
                boundBoxFunc={(oldBox, newBox) => {
                  if (
                    Math.abs(newBox.width) < 5 ||
                    Math.abs(newBox.height) < 5
                  ) {
                    return oldBox;
                  }
                  return newBox;
                }}
              />
            </Layer>
          </Stage>
        )}

        {editingText && stageRef.current && (
          <TextEditor
            shape={editingText}
            stage={stageRef.current}
            stageScale={stageScale}
            onChange={(text) => {
              const next = text.trim() ? text : DEFAULT_TEXT;
              updateShape(editingText.id, { text: next });
            }}
            onClose={() => setEditingTextId(null)}
          />
        )}
      </div>
    );
  },
);

export default DrawingCanvas;
