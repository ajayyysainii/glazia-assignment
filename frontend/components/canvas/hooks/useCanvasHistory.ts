"use client";

import { useCallback, useRef, useState } from "react";
import type { CanvasShape } from "../types";

export function useCanvasHistory() {
  const [shapes, setShapes] = useState<CanvasShape[]>([]);
  const [history, setHistory] = useState<CanvasShape[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const historyRef = useRef(history);
  const historyIndexRef = useRef(historyIndex);
  historyRef.current = history;
  historyIndexRef.current = historyIndex;

  const commitShapes = useCallback((next: CanvasShape[]) => {
    setShapes(next);
    setHistory((prev) => {
      const clipped = prev.slice(0, historyIndexRef.current + 1);
      const updated = [...clipped, next];
      setHistoryIndex(updated.length - 1);
      return updated;
    });
  }, []);

  const undo = useCallback(() => {
    setHistoryIndex((i) => {
      if (i <= 0) return i;
      const next = i - 1;
      setShapes(historyRef.current[next] ?? []);
      return next;
    });
  }, []);

  const redo = useCallback(() => {
    setHistoryIndex((i) => {
      const hist = historyRef.current;
      if (i >= hist.length - 1) return i;
      const next = i + 1;
      setShapes(hist[next] ?? []);
      return next;
    });
  }, []);

  return {
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
  };
}
