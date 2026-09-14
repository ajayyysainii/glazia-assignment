"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutGrid, PanelRight } from "lucide-react";
import { AuthBar, type AuthMode } from "@/components/auth";
import DrawingCanvas, {
  type DrawingCanvasHandle,
} from "@/components/canvas/DrawingCanvas";
import { CanvasDashboard } from "@/components/canvas/CanvasDashboard";
import { CanvasSidebar } from "@/components/canvas/CanvasSidebar";
import { SaveStatusHud } from "@/components/canvas/SaveStatusHud";
import { useCanvasPersistence } from "@/components/canvas/hooks/useCanvasPersistence";
import { useAuth } from "@/lib/auth";
import type { CanvasDocument } from "@/lib/canvas";

function WorkspaceInner() {
  const { user, loading } = useAuth();
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [activeCanvasId, setActiveCanvasId] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState("Untitled canvas");
  const [dirty, setDirty] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [listToken, setListToken] = useState(0);
  const settled = useRef(false);

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
    dirty,
    onActiveChange,
    onDirtyChange: setDirty,
  });

  // The dashboard is the landing view for signed-in users, and never exists
  // for signed-out ones. Only the restored session opens it on arrival —
  // logging in mid-sketch shouldn't yank the board away.
  useEffect(() => {
    if (loading) return;
    if (!settled.current) {
      settled.current = true;
      if (user) setShowDashboard(true);
      return;
    }
    if (!user) setShowDashboard(false);
  }, [user, loading]);

  // Keep the list fresh after each successful save.
  useEffect(() => {
    if (status === "saved") setListToken((t) => t + 1);
  }, [status]);

  const loadCanvas = useCallback((canvas: CanvasDocument) => {
    canvasRef.current?.loadDocument({
      shapes: canvas.shapes,
      viewport: canvas.viewport,
    });
    setActiveCanvasId(canvas.id);
    setActiveTitle(canvas.title);
    setShowDashboard(false);
  }, []);

  const openDashboard = useCallback(async () => {
    if (dirty) await persist({ silent: true });
    setShowDashboard(true);
  }, [dirty, persist]);

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <DrawingCanvas ref={canvasRef} onDirtyChange={setDirty} />
      <AuthBar mode={authMode} onModeChange={setAuthMode} />
      <SaveStatusHud
        status={status}
        error={error}
        loggedIn={Boolean(user)}
      />

      {/* One cluster, so the board chrome reads as a single control surface
          rather than a column of unrelated floating buttons. */}
      <div
        className="absolute right-3 top-[4.25rem] z-30 flex flex-col items-center gap-0.5 rounded-2xl bg-white/95 p-1 shadow-[0_10px_40px_rgba(28,32,42,0.12)] ring-1 ring-black/5 backdrop-blur lg:right-5 lg:top-[4.75rem]"
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
            <span className="h-px w-5 bg-[#e2e5eb]" />
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
        dirty={dirty}
        saveStatus={status}
        saveError={error}
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
          refreshToken={listToken}
          onOpen={loadCanvas}
          onCreate={loadCanvas}
          onClose={() => setShowDashboard(false)}
        />
      ) : null}
    </main>
  );
}

export default function CanvasWorkspace() {
  return <WorkspaceInner />;
}
