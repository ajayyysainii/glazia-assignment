"use client";

import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { TOOL_SHORTCUTS } from "../constants";
import type { CanvasShape, Tool } from "../types";

type UseCanvasKeyboardArgs = {
  spaceHeld: MutableRefObject<boolean>;
  shapesRef: MutableRefObject<CanvasShape[]>;
  selectedIdRef: MutableRefObject<string | null>;
  historyRef: MutableRefObject<CanvasShape[][]>;
  historyIndexRef: MutableRefObject<number>;
  setShapes: (shapes: CanvasShape[]) => void;
  setHistory: Dispatch<SetStateAction<CanvasShape[][]>>;
  setHistoryIndex: Dispatch<SetStateAction<number>>;
  setSelectedId: (id: string | null) => void;
  setTool: (tool: Tool) => void;
};

export function useCanvasKeyboard({
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
}: UseCanvasKeyboardArgs) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spaceHeld.current = true;
        e.preventDefault();
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          setHistoryIndex((i) => {
            const hist = historyRef.current;
            if (i >= hist.length - 1) return i;
            const next = i + 1;
            setShapes(hist[next] ?? []);
            setSelectedId(null);
            return next;
          });
        } else {
          setHistoryIndex((i) => {
            if (i <= 0) return i;
            const next = i - 1;
            setShapes(historyRef.current[next] ?? []);
            setSelectedId(null);
            return next;
          });
        }
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        const id = selectedIdRef.current;
        if (!id) return;
        const target = e.target as HTMLElement | null;
        if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
        e.preventDefault();
        const next = shapesRef.current.filter((s) => s.id !== id);
        setShapes(next);
        setHistory((prev) => {
          const clipped = prev.slice(0, historyIndexRef.current + 1);
          return [...clipped, next];
        });
        setHistoryIndex((i) => i + 1);
        setSelectedId(null);
      }

      const shortcut = TOOL_SHORTCUTS[e.key];
      if (shortcut) setTool(shortcut);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") spaceHeld.current = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [
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
  ]);
}
