"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutGrid, PanelRight } from "lucide-react";
import { AuthModals, ProfileMenu, type AuthMode } from "@/components/auth";
import DrawingCanvas, {
  type DrawingCanvasHandle,
} from "@/components/canvas/DrawingCanvas";
import { CanvasDashboard } from "@/components/canvas/CanvasDashboard";
import { CanvasSidebar } from "@/components/canvas/CanvasSidebar";
import { SaveStatusHud } from "@/components/canvas/SaveStatusHud";
import { useCanvasPersistence } from "@/components/canvas/hooks/useCanvasPersistence";
import { useConfirm, useToast } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { getCanvas, type CanvasDocument } from "@/lib/canvas";
import { ApiError } from "@/lib/api/client";

function WorkspaceInner() {
  const { user, loading } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [activeCanvasId, setActiveCanvasId] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState("Untitled canvas");
  const [dirty, setDirty] = useState(false);
  const [boardEmpty, setBoardEmpty] = useState(true);
  // `null` means "not decided yet", so the first paint after auth resolves
  // already knows whether the dashboard belongs on top — no canvas flash.
  const [dashboardOverride, setDashboardOverride] = useState<boolean | null>(
    null,
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [listToken, setListToken] = useState(0);

  const showDashboard = dashboardOverride ?? Boolean(user);

  // An empty board that has never been saved has nothing worth writing:
  // panning or zooming it shouldn't conjure an "Untitled canvas" into the
  // library. Treating it as clean (rather than blocking the write later) is
  // what makes the first real mark flip dirty and trigger the autosave.
  const nothingToSave = boardEmpty && !activeCanvasId;
  const hasUnsavedWork = dirty && !nothingToSave;

  const onActiveChange = useCallback(
    (canvas: { id: string | null; title: string }) => {
      setActiveCanvasId(canvas.id);
      setActiveTitle(canvas.title);
    },
    [],
  );

  const { status, error, setError, persist } = useCanvasPersistence({
    canvasRef,
    activeCanvasId,
    activeTitle,
    dirty: hasUnsavedWork,
    onActiveChange,
    onDirtyChange: setDirty,
  });

  // Logging out drops you back onto the board; there is no library to show.
  useEffect(() => {
    if (!loading && !user) setDashboardOverride(false);
  }, [user, loading]);

  // Surface save failures once each, rather than as a permanent inline banner.
  const lastError = useRef<string | null>(null);
  useEffect(() => {
    if (status === "error" && error && error !== lastError.current) {
      lastError.current = error;
      toast.error(error, {
        action: { label: "Retry", onAction: () => void persist() },
      });
    }
    if (status !== "error") lastError.current = null;
  }, [status, error, toast, persist]);

  useEffect(() => {
    if (status === "saved") setListToken((t) => t + 1);
  }, [status]);

  // Closing the tab mid-edit is the one case only the browser can warn about.
  useEffect(() => {
    if (!hasUnsavedWork) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasUnsavedWork]);

  const loadCanvas = useCallback((canvas: CanvasDocument) => {
    canvasRef.current?.loadDocument({
      shapes: canvas.shapes,
      viewport: canvas.viewport,
    });
    setActiveCanvasId(canvas.id);
    setActiveTitle(canvas.title);
    setDashboardOverride(false);
  }, []);

  /** Throw away local edits by reloading the last saved version. */
  const discardChanges = useCallback(async () => {
    if (!activeCanvasId) {
      canvasRef.current?.clearLocal();
      onActiveChange({ id: null, title: "Untitled canvas" });
      return;
    }
    try {
      const saved = await getCanvas(activeCanvasId);
      canvasRef.current?.loadDocument({
        shapes: saved.shapes,
        viewport: saved.viewport,
      });
      setActiveTitle(saved.title);
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Couldn't restore the saved version",
      );
    }
  }, [activeCanvasId, onActiveChange, toast]);

  const openDashboard = useCallback(async () => {
    const choice = hasUnsavedWork
      ? await confirm({
          title: "Leave this board?",
          description:
            "You have changes that haven't been saved yet. Save them, discard them, or stay here.",
          confirmLabel: "Save & leave",
          altLabel: "Discard changes",
          cancelLabel: "Stay",
        })
      : await confirm({
          title: "Leave this board?",
          description: nothingToSave
            ? "This board is still empty, so there is nothing to lose."
            : "Every change here is saved. You can reopen it anytime.",
          confirmLabel: "Leave",
          cancelLabel: "Stay",
        });

    if (choice === "cancel") return;

    if (choice === "confirm" && hasUnsavedWork) {
      const saved = await persist();
      if (!saved) return; // The failure toast already explained why.
      toast.success("Board saved");
    }

    if (choice === "alt") {
      await discardChanges();
      toast.info("Changes discarded");
    }

    setDashboardOverride(true);
  }, [confirm, hasUnsavedWork, nothingToSave, discardChanges, persist, toast]);

  // Hold the board back until the session is known, so a logged-in visitor
  // never sees the canvas flash past before their library appears.
  if (loading) {
    return (
      <main className="flex h-dvh w-full items-center justify-center bg-[#f4f5f7] text-sm text-[#6b7285]">
        Loading…
      </main>
    );
  }

  return (
    <main className="relative h-dvh w-full overflow-clip">
      <DrawingCanvas
        ref={canvasRef}
        onDirtyChange={setDirty}
        onEmptyChange={setBoardEmpty}
        // Desktop: the account control sits under the palette, in the rail.
        railFooter={
          <ProfileMenu
            variant="rail"
            onRequestAuth={setAuthMode}
            onBrowseAll={user ? () => void openDashboard() : undefined}
          />
        }
      />

      {/* Below lg there is no rail, so the account control keeps its corner. */}
      <div
        className="absolute right-3 top-3 z-40 lg:hidden"
        style={{
          marginTop: "var(--safe-top)",
          marginRight: "var(--safe-right)",
        }}
      >
        <ProfileMenu
          variant="bar"
          onRequestAuth={setAuthMode}
          onBrowseAll={user ? () => void openDashboard() : undefined}
        />
      </div>

      <AuthModals mode={authMode} onModeChange={setAuthMode} />
      <SaveStatusHud status={status} loggedIn={Boolean(user)} />

      {/* One cluster, so the board chrome reads as a single control surface
          rather than a column of unrelated floating buttons. */}
      <div
        className="absolute right-3 top-[4.25rem] z-30 flex items-center gap-0.5 rounded-2xl bg-white/95 p-1 shadow-[0_10px_40px_rgba(28,32,42,0.12)] ring-1 ring-black/5 backdrop-blur lg:right-5 lg:top-5"
        style={{
          marginTop: "var(--safe-top)",
          marginRight: "var(--safe-right)",
        }}
      >
        {user ? (
          <>
            <button
              type="button"
              onClick={() => void openDashboard()}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[#3f4555] transition hover:bg-[#eef0f4] hover:text-[#1c202a]"
              title="All canvases"
              aria-label="Show all canvases"
            >
              <LayoutGrid size={18} strokeWidth={1.8} />
            </button>
            <span className="h-5 w-px bg-[#e2e5eb]" />
          </>
        ) : null}
        <button
          type="button"
          onClick={() => setSidebarOpen((v) => !v)}
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
            sidebarOpen
              ? "bg-[#1c202a] text-white"
              : "text-[#3f4555] hover:bg-[#eef0f4] hover:text-[#1c202a]"
          }`}
          title="Board details"
          aria-label="Open board details"
          aria-expanded={sidebarOpen}
        >
          <PanelRight size={18} strokeWidth={1.8} />
        </button>
      </div>

      <CanvasSidebar
        canvasRef={canvasRef}
        activeCanvasId={activeCanvasId}
        activeTitle={activeTitle}
        dirty={hasUnsavedWork}
        // Empty and never saved: autosave deliberately leaves it alone.
        nothingToSave={nothingToSave}
        saveStatus={status}
        onSaveErrorClear={() => setError(null)}
        onPersist={persist}
        onActiveChange={onActiveChange}
        onRequestLogin={() => setAuthMode("login")}
        onBrowseAll={() => {
          setSidebarOpen(false);
          void openDashboard();
        }}
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
      />

      {user && showDashboard ? (
        <CanvasDashboard
          activeCanvasId={activeCanvasId}
          // Landing straight on the dashboard means there is no board behind.
          canReturn={dashboardOverride === true}
          refreshToken={listToken}
          onOpen={loadCanvas}
          onCreate={loadCanvas}
          onClose={() => setDashboardOverride(false)}
        />
      ) : null}
    </main>
  );
}

export default function CanvasWorkspace() {
  return <WorkspaceInner />;
}
