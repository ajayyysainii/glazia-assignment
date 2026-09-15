"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearGuestDraft,
  loadGuestDraft,
  saveGuestDraft,
} from "@/lib/canvas";
import type { DrawingCanvasHandle } from "@/components/canvas/DrawingCanvas";

type UseGuestDraftArgs = {
  canvasRef: React.RefObject<DrawingCanvasHandle | null>;
  /** Only while signed out — signed-in boards belong to the server. */
  enabled: boolean;
  dirty: boolean;
};

const SAVE_DELAY = 700;

/**
 * Keeps a signed-out board on the device so it's still there next visit.
 *
 * On a successful write the board is marked clean, exactly as a server save
 * does — which quiets the "unsaved changes" warnings, since the work isn't
 * actually at risk. If the write fails (storage blocked or full) the board
 * stays dirty on purpose, so the close-tab warning still fires.
 */
export function useGuestDraft({
  canvasRef,
  enabled,
  dirty,
}: UseGuestDraftArgs) {
  const [restored, setRestored] = useState(false);
  const [storageBlocked, setStorageBlocked] = useState(false);
  // Marked when a load *finishes*, not when one starts: Strict Mode runs this
  // effect twice, and a flag set up front would cancel the first load and
  // short-circuit the second, leaving the board permanently un-restored.
  // It also stops a later sign-out from replaying the old draft over the
  // board currently on screen.
  const restoredOnce = useRef(false);

  useEffect(() => {
    if (!enabled || restoredOnce.current) return;

    let cancelled = false;
    void loadGuestDraft().then((draft) => {
      if (cancelled) return;
      restoredOnce.current = true;
      if (draft?.shapes?.length) {
        canvasRef.current?.loadDocument({
          shapes: draft.shapes,
          viewport: draft.viewport,
        });
      }
      setRestored(true);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, canvasRef]);

  useEffect(() => {
    // Waiting for the restore avoids writing a blank board over a saved one.
    if (!enabled || !restored || !dirty) return;

    const timer = window.setTimeout(async () => {
      const snapshot = canvasRef.current?.getSnapshot();
      if (!snapshot) return;

      if (snapshot.shapes.length === 0) {
        await clearGuestDraft();
        canvasRef.current?.markClean(snapshot);
        return;
      }

      const saved = await saveGuestDraft({
        shapes: snapshot.shapes,
        viewport: snapshot.viewport,
        updatedAt: Date.now(),
      });

      setStorageBlocked(!saved);
      if (saved) canvasRef.current?.markClean(snapshot);
    }, SAVE_DELAY);

    return () => window.clearTimeout(timer);
  }, [enabled, restored, dirty, canvasRef]);

  const discardLocalDraft = useCallback(async () => {
    await clearGuestDraft();
  }, []);

  return { restored, storageBlocked, discardLocalDraft };
}
