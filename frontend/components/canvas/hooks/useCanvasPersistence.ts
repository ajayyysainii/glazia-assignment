"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  createCanvas,
  updateCanvas,
  type CanvasSnapshot,
} from "@/lib/canvas";
import { ApiError } from "@/lib/api/client";
import type { DrawingCanvasHandle } from "@/components/canvas/DrawingCanvas";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

type UseCanvasPersistenceArgs = {
  canvasRef: React.RefObject<DrawingCanvasHandle | null>;
  activeCanvasId: string | null;
  activeTitle: string;
  dirty: boolean;
  onActiveChange: (canvas: { id: string | null; title: string }) => void;
  onDirtyChange: (dirty: boolean) => void;
};

export function useCanvasPersistence({
  canvasRef,
  activeCanvasId,
  activeTitle,
  dirty,
  onActiveChange,
  onDirtyChange,
}: UseCanvasPersistenceArgs) {
  const { user } = useAuth();
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);
  const pendingRef = useRef(false);
  const activeIdRef = useRef(activeCanvasId);
  const titleRef = useRef(activeTitle);

  activeIdRef.current = activeCanvasId;
  titleRef.current = activeTitle;

  const persist = useCallback(
    async (options?: { silent?: boolean; forceCreate?: boolean }) => {
      if (!user) return null;
      const snapshot = canvasRef.current?.getSnapshot();
      if (!snapshot) return null;

      // An untouched board is not a document. Panning or zooming a blank
      // canvas marks it dirty, which would otherwise autosave an empty
      // "Untitled canvas" into the library. Once a board exists on the server
      // this no longer applies: clearing it is a real edit worth saving, and
      // an explicit save still works either way.
      if (
        options?.silent &&
        snapshot.shapes.length === 0 &&
        !activeIdRef.current
      ) {
        return null;
      }

      if (savingRef.current) {
        pendingRef.current = true;
        return null;
      }
      savingRef.current = true;
      pendingRef.current = false;
      if (!options?.silent) setStatus("saving");
      else setStatus((prev) => (prev === "error" ? prev : "saving"));
      setError(null);

      let shouldRetry = false;

      try {
        const title =
          titleRef.current.trim() ||
          `Canvas ${new Date().toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}`;

        const payload: CanvasSnapshot & { title: string } = {
          title,
          shapes: snapshot.shapes,
          viewport: snapshot.viewport,
        };

        const currentId = options?.forceCreate
          ? null
          : activeIdRef.current;
        const canvas = currentId
          ? await updateCanvas(currentId, payload)
          : await createCanvas(payload);

        // Baseline = what we actually wrote, so mid-save edits stay dirty
        canvasRef.current?.markClean({
          shapes: payload.shapes,
          viewport: payload.viewport,
        });
        onActiveChange({ id: canvas.id, title: canvas.title });

        const after = canvasRef.current?.getSnapshot();
        const stillDirty =
          after != null &&
          JSON.stringify(after) !==
            JSON.stringify({
              shapes: payload.shapes,
              viewport: payload.viewport,
            });
        if (stillDirty) {
          onDirtyChange(true);
          shouldRetry = true;
        }
        if (pendingRef.current) {
          shouldRetry = true;
        }

        setStatus("saved");
        return canvas;
      } catch (err) {
        pendingRef.current = false;
        const message =
          err instanceof ApiError ? err.message : "Failed to save canvas";
        setError(message);
        setStatus("error");
        return null;
      } finally {
        savingRef.current = false;
        pendingRef.current = false;
        if (shouldRetry) {
          window.setTimeout(() => {
            void persist({ silent: true });
          }, 0);
        }
      }
    },
    [user, canvasRef, onActiveChange, onDirtyChange],
  );

  // Auto-save shortly after drawing / editing when logged in
  useEffect(() => {
    if (!user || !dirty) return;

    setStatus((prev) => (prev === "saved" ? "idle" : prev));
    const timer = window.setTimeout(() => {
      void persist({ silent: true });
    }, 900);

    return () => window.clearTimeout(timer);
  }, [dirty, user, persist]);

  // Clear saved flash after a moment
  useEffect(() => {
    if (status !== "saved") return;
    const timer = window.setTimeout(() => setStatus("idle"), 2000);
    return () => window.clearTimeout(timer);
  }, [status]);

  return {
    status,
    error,
    setError,
    persist,
  };
}
