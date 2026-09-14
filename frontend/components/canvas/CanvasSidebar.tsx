"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PanelRight,
  Plus,
  Save,
  Trash2,
  X,
  FolderOpen,
  LoaderCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  createCanvas,
  deleteCanvas,
  getCanvas,
  listCanvases,
  updateCanvas,
  type CanvasSummary,
} from "@/lib/canvas";
import { ApiError } from "@/lib/api/client";
import type { DrawingCanvasHandle } from "@/components/canvas/DrawingCanvas";

type CanvasSidebarProps = {
  canvasRef: React.RefObject<DrawingCanvasHandle | null>;
  activeCanvasId: string | null;
  activeTitle: string;
  dirty: boolean;
  onActiveChange: (canvas: {
    id: string | null;
    title: string;
  }) => void;
  onRequestLogin: () => void;
};

export function CanvasSidebar({
  canvasRef,
  activeCanvasId,
  activeTitle,
  dirty,
  onActiveChange,
  onRequestLogin,
}: CanvasSidebarProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [canvases, setCanvases] = useState<CanvasSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState(activeTitle);

  useEffect(() => {
    setTitleDraft(activeTitle);
  }, [activeTitle]);

  const refreshList = useCallback(async () => {
    if (!user) {
      setCanvases([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const items = await listCanvases();
      setCanvases(items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load canvases");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (open && user) {
      void refreshList();
    }
  }, [open, user, refreshList]);

  const requireAuth = () => {
    if (!user) {
      onRequestLogin();
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!requireAuth()) return;
    const snapshot = canvasRef.current?.getSnapshot();
    if (!snapshot) return;

    setBusy("create");
    setError(null);
    try {
      const title =
        titleDraft.trim() ||
        `Canvas ${new Date().toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      const canvas = await createCanvas({
        title,
        shapes: snapshot.shapes,
        viewport: snapshot.viewport,
      });
      canvasRef.current?.markClean();
      onActiveChange({ id: canvas.id, title: canvas.title });
      setTitleDraft(canvas.title);
      await refreshList();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create canvas");
    } finally {
      setBusy(null);
    }
  };

  const handleSave = async () => {
    if (!requireAuth()) return;
    const snapshot = canvasRef.current?.getSnapshot();
    if (!snapshot) return;

    setBusy("save");
    setError(null);
    try {
      if (!activeCanvasId) {
        const title =
          titleDraft.trim() ||
          `Canvas ${new Date().toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}`;
        const canvas = await createCanvas({
          title,
          shapes: snapshot.shapes,
          viewport: snapshot.viewport,
        });
        canvasRef.current?.markClean();
        onActiveChange({ id: canvas.id, title: canvas.title });
        setTitleDraft(canvas.title);
        await refreshList();
        return;
      }

      const canvas = await updateCanvas(activeCanvasId, {
        title: titleDraft.trim() || activeTitle || "Untitled canvas",
        shapes: snapshot.shapes,
        viewport: snapshot.viewport,
      });
      canvasRef.current?.markClean();
      onActiveChange({ id: canvas.id, title: canvas.title });
      await refreshList();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save canvas");
    } finally {
      setBusy(null);
    }
  };

  const handleOpen = async (id: string) => {
    if (!requireAuth()) return;
    if (dirty) {
      const ok = window.confirm(
        "You have unsaved changes. Discard them and open this canvas?",
      );
      if (!ok) return;
    }

    setBusy(`open:${id}`);
    setError(null);
    try {
      const canvas = await getCanvas(id);
      canvasRef.current?.loadDocument({
        shapes: canvas.shapes,
        viewport: canvas.viewport,
      });
      onActiveChange({ id: canvas.id, title: canvas.title });
      setTitleDraft(canvas.title);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to open canvas");
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!requireAuth()) return;
    const ok = window.confirm("Delete this canvas permanently?");
    if (!ok) return;

    setBusy(`delete:${id}`);
    setError(null);
    try {
      await deleteCanvas(id);
      if (activeCanvasId === id) {
        canvasRef.current?.clearLocal();
        onActiveChange({ id: null, title: "Untitled canvas" });
        setTitleDraft("Untitled canvas");
      }
      await refreshList();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete canvas");
    } finally {
      setBusy(null);
    }
  };

  const handleNewBlank = () => {
    if (dirty) {
      const ok = window.confirm(
        "Start a new blank canvas? Unsaved changes will be lost.",
      );
      if (!ok) return;
    }
    canvasRef.current?.clearLocal();
    onActiveChange({ id: null, title: "Untitled canvas" });
    setTitleDraft("Untitled canvas");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="absolute right-5 top-[4.75rem] z-30 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/95 text-[#1c202a] shadow-[0_10px_40px_rgba(28,32,42,0.12)] ring-1 ring-black/5 backdrop-blur transition hover:bg-white"
        title="Canvases"
        aria-label="Open canvases sidebar"
        aria-expanded={open}
      >
        <PanelRight size={18} strokeWidth={1.8} />
      </button>

      <aside
        className={`absolute right-0 top-0 z-40 flex h-full w-[min(100vw,320px)] flex-col border-l border-black/5 bg-white/95 shadow-[-12px_0_40px_rgba(28,32,42,0.08)] backdrop-blur transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#eef0f4] px-4 py-4">
          <div>
            <p className="font-display text-lg font-semibold text-[#1c202a]">
              Canvases
            </p>
            <p className="text-xs text-[#6b7285]">
              {user ? "Saved to your account" : "Log in to save boards"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#6b7285] transition hover:bg-[#eef0f4] hover:text-[#1c202a]"
            aria-label="Close sidebar"
          >
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        <div className="space-y-3 border-b border-[#eef0f4] px-4 py-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-[#6b7285]">
              Title
            </span>
            <input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              className="w-full rounded-xl border border-[#e2e5eb] bg-[#f8f9fb] px-3 py-2 text-sm text-[#1c202a] outline-none focus:border-[#1c202a]/25 focus:bg-white focus:ring-2 focus:ring-[#1c202a]/10"
              placeholder="Untitled canvas"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={busy !== null}
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#1c202a] text-sm font-medium text-white transition hover:bg-[#2b3140] disabled:opacity-50"
            >
              {busy === "create" ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Plus size={16} strokeWidth={1.8} />
              )}
              New
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={busy !== null}
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#e2e5eb] text-sm font-medium text-[#1c202a] transition hover:bg-[#eef0f4] disabled:opacity-50"
            >
              {busy === "save" ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Save size={16} strokeWidth={1.8} />
              )}
              {dirty ? "Save*" : "Save"}
            </button>
          </div>

          <button
            type="button"
            onClick={handleNewBlank}
            className="flex h-9 w-full items-center justify-center rounded-xl text-sm text-[#6b7285] transition hover:bg-[#eef0f4] hover:text-[#1c202a]"
          >
            Clear to blank board
          </button>

          {error ? (
            <p className="rounded-xl bg-[#fff1f0] px-3 py-2 text-xs text-[#c92a2a]">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {!user ? (
            <div className="rounded-2xl bg-[#f8f9fb] px-4 py-6 text-center">
              <p className="text-sm text-[#3f4555]">
                Log in to create and store canvases in MongoDB.
              </p>
              <button
                type="button"
                onClick={onRequestLogin}
                className="mt-3 text-sm font-medium text-[#1c202a] underline-offset-2 hover:underline"
              >
                Log in
              </button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-[#6b7285]">
              <LoaderCircle size={16} className="animate-spin" />
              Loading…
            </div>
          ) : canvases.length === 0 ? (
            <div className="rounded-2xl bg-[#f8f9fb] px-4 py-6 text-center text-sm text-[#6b7285]">
              No saved canvases yet. Click <strong>New</strong> to store this
              board.
            </div>
          ) : (
            <ul className="space-y-2">
              {canvases.map((item) => {
                const active = item.id === activeCanvasId;
                return (
                  <li key={item.id}>
                    <div
                      className={`rounded-2xl border p-3 transition ${
                        active
                          ? "border-[#1c202a]/20 bg-[#eef0f4]"
                          : "border-transparent bg-[#f8f9fb] hover:border-[#e2e5eb]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleOpen(item.id)}
                        disabled={busy !== null}
                        className="flex w-full items-start gap-2 text-left"
                      >
                        <FolderOpen
                          size={16}
                          strokeWidth={1.8}
                          className="mt-0.5 shrink-0 text-[#6b7285]"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-[#1c202a]">
                            {item.title}
                          </span>
                          <span className="mt-0.5 block text-xs text-[#6b7285]">
                            {item.shapeCount} shapes
                            {item.updatedAt
                              ? ` · ${new Date(item.updatedAt).toLocaleDateString()}`
                              : ""}
                          </span>
                        </span>
                        {busy === `open:${item.id}` ? (
                          <LoaderCircle
                            size={14}
                            className="mt-1 animate-spin text-[#6b7285]"
                          />
                        ) : null}
                      </button>
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          disabled={busy !== null}
                          className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs text-[#c92a2a] transition hover:bg-[#fff1f0] disabled:opacity-50"
                        >
                          <Trash2 size={13} strokeWidth={1.8} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
