"use client";

import { useEffect, useState } from "react";
import {
  Check,
  CloudOff,
  PenLine,
  LayoutGrid,
  LoaderCircle,
  Plus,
  Save,
  X,
} from "lucide-react";
import { useConfirm, useToast } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import type { DrawingCanvasHandle } from "@/components/canvas/DrawingCanvas";
import type { SaveStatus } from "@/components/canvas/hooks/useCanvasPersistence";

type CanvasSidebarProps = {
  canvasRef: React.RefObject<DrawingCanvasHandle | null>;
  activeCanvasId: string | null;
  activeTitle: string;
  dirty: boolean;
  nothingToSave: boolean;
  saveStatus: SaveStatus;
  onSaveErrorClear: () => void;
  onPersist: (options?: {
    silent?: boolean;
    forceCreate?: boolean;
  }) => Promise<unknown>;
  onActiveChange: (canvas: { id: string | null; title: string }) => void;
  onRequestLogin: () => void;
  /** Hand browsing off to the dashboard, which owns the whole library. */
  onBrowseAll: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function SaveLine({
  status,
  dirty,
  nothingToSave,
  loggedIn,
}: {
  status: SaveStatus;
  dirty: boolean;
  nothingToSave: boolean;
  loggedIn: boolean;
}) {
  if (!loggedIn) {
    return (
      <span className="flex items-center gap-1.5 text-[#9aa0ad]">
        <CloudOff size={13} strokeWidth={1.8} />
        Not saving — you are logged out
      </span>
    );
  }
  if (nothingToSave) {
    return (
      <span className="flex items-center gap-1.5 text-[#9aa0ad]">
        <PenLine size={13} strokeWidth={1.8} />
        Draw something and it saves itself
      </span>
    );
  }
  if (status === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-[#6b7285]">
        <LoaderCircle size={13} className="animate-spin" />
        Saving…
      </span>
    );
  }
  if (dirty) {
    return (
      <span className="flex items-center gap-1.5 text-[#6b7285]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#f08c00]" />
        Unsaved changes
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-[#6b7285]">
      <Check size={13} strokeWidth={2} className="text-[#2f9e44]" />
      All changes saved
    </span>
  );
}

export function CanvasSidebar({
  canvasRef,
  activeCanvasId,
  activeTitle,
  dirty,
  nothingToSave,
  saveStatus,
  onSaveErrorClear,
  onPersist,
  onActiveChange,
  onRequestLogin,
  onBrowseAll,
  open,
  onOpenChange,
}: CanvasSidebarProps) {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const setOpen = onOpenChange;
  const [busy, setBusy] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState(activeTitle);

  useEffect(() => {
    setTitleDraft(activeTitle);
  }, [activeTitle]);

  // On phones the panel covers the board, so Escape needs to dismiss it.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  const setTitle = (next: string) => {
    setTitleDraft(next);
    onActiveChange({ id: activeCanvasId, title: next });
  };

  const requireAuth = () => {
    if (!user) {
      onRequestLogin();
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!requireAuth()) return;
    setBusy("save");
    onSaveErrorClear();
    try {
      const saved = await onPersist();
      if (saved) toast.success("Board saved");
    } finally {
      setBusy(null);
    }
  };

  const handleDuplicateAsNew = async () => {
    if (!requireAuth()) return;
    setBusy("create");
    onSaveErrorClear();
    try {
      const copy = await onPersist({ forceCreate: true });
      if (copy) toast.success("Saved as a new board");
    } finally {
      setBusy(null);
    }
  };

  const handleNewBlank = async () => {
    if (dirty) {
      const choice = await confirm({
        title: "Start a blank board?",
        description: user
          ? "This board has unsaved changes. They'll be lost unless you save first."
          : "You're logged out, so nothing here is saved. Starting fresh will lose this drawing.",
        confirmLabel: "Start blank",
        cancelLabel: "Keep drawing",
        tone: "danger",
      });
      if (choice !== "confirm") return;
    }
    canvasRef.current?.clearLocal();
    onActiveChange({ id: null, title: "Untitled canvas" });
    setTitleDraft("Untitled canvas");
    setOpen(false);
  };

  return (
    <>
      {/* Dim the board behind the panel while it covers the screen on phones */}
      <button
        type="button"
        aria-label="Close board panel"
        tabIndex={open ? 0 : -1}
        onClick={() => setOpen(false)}
        className={`absolute inset-0 z-30 cursor-default bg-[#1c202a]/30 transition-opacity duration-200 sm:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        // `inert` (not aria-hidden) keeps the offscreen panel's buttons out of
        // both the tab order and the accessibility tree.
        inert={!open}
        className={`absolute right-0 top-0 z-40 flex h-full w-[min(100vw_-_2.5rem,340px)] flex-col border-l border-black/5 bg-white shadow-[-12px_0_40px_rgba(28,32,42,0.10)] transition-transform duration-200 sm:w-[min(100vw,320px)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          paddingTop: "var(--safe-top)",
          paddingBottom: "var(--safe-bottom)",
          paddingRight: "var(--safe-right)",
        }}
      >
        <div className="flex items-start justify-between gap-2 px-5 pb-4 pt-5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9aa0ad]">
              This board
            </p>
            <p className="mt-1.5 truncate font-display text-lg font-semibold text-[#1c202a]">
              {activeTitle || "Untitled canvas"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="-mr-1 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#6b7285] transition hover:bg-[#eef0f4] hover:text-[#1c202a]"
            aria-label="Close panel"
          >
            <X size={17} strokeWidth={1.8} />
          </button>
        </div>

        <div className="space-y-4 px-5 pb-5">
          <label className="block space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9aa0ad]">
              Title
            </span>
            <input
              value={titleDraft}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl bg-[#f4f5f7] px-3 py-2.5 text-base text-[#1c202a] outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-[#1c202a]/20 sm:py-2 sm:text-sm"
              placeholder="Untitled canvas"
            />
          </label>

          <p className="text-xs">
            <SaveLine
              status={saveStatus}
              dirty={dirty}
              nothingToSave={nothingToSave}
              loggedIn={Boolean(user)}
            />
          </p>

          <button
            type="button"
            onClick={handleSave}
            disabled={busy !== null || saveStatus === "saving"}
            className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-[#1c202a] text-sm font-medium text-white transition hover:bg-[#2b3140] disabled:opacity-50"
          >
            {busy === "save" || saveStatus === "saving" ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Save size={16} strokeWidth={1.8} />
            )}
            Save now
          </button>
        </div>

        <div className="mt-auto space-y-1 border-t border-[#eef0f4] px-3 py-3">
          {user ? (
            <button
              type="button"
              onClick={onBrowseAll}
              className="flex h-11 w-full items-center gap-2.5 rounded-xl px-2.5 text-sm text-[#3f4555] transition hover:bg-[#f4f5f7] hover:text-[#1c202a]"
            >
              <LayoutGrid size={16} strokeWidth={1.8} />
              All canvases
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => void handleNewBlank()}
            className="flex h-11 w-full items-center gap-2.5 rounded-xl px-2.5 text-sm text-[#3f4555] transition hover:bg-[#f4f5f7] hover:text-[#1c202a]"
          >
            <Plus size={16} strokeWidth={1.8} />
            Blank board
          </button>

          {user ? (
            <button
              type="button"
              onClick={handleDuplicateAsNew}
              disabled={busy !== null}
              className="flex h-11 w-full items-center gap-2.5 rounded-xl px-2.5 text-sm text-[#3f4555] transition hover:bg-[#f4f5f7] hover:text-[#1c202a] disabled:opacity-50"
            >
              {busy === "create" ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Save size={16} strokeWidth={1.8} />
              )}
              Save as a copy
            </button>
          ) : (
            <button
              type="button"
              onClick={onRequestLogin}
              className="flex h-11 w-full items-center justify-center rounded-xl bg-[#f4f5f7] text-sm font-medium text-[#1c202a] transition hover:bg-[#eef0f4]"
            >
              Log in to save boards
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
