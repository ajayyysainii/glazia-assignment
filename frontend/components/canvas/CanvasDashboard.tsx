"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, LoaderCircle, LogOut, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  createCanvas,
  deleteCanvas,
  getCanvas,
  listCanvases,
  type CanvasDocument,
  type CanvasSummary,
} from "@/lib/canvas";
import { ApiError } from "@/lib/api/client";
import { useConfirm, useToast } from "@/components/ui";
import { CanvasThumbnail } from "./CanvasThumbnail";
import { useCoarsePointer } from "./hooks/useMediaQuery";

type CanvasDashboardProps = {
  onOpen: (canvas: CanvasDocument) => void;
  onCreate: (canvas: CanvasDocument) => void;
  onClose: () => void;
  activeCanvasId: string | null;
  /** False when the dashboard is the landing view, so there is nothing behind it. */
  canReturn: boolean;
  refreshToken?: number;
};

/** Search only earns its space once a library is big enough to get lost in. */
const SEARCH_THRESHOLD = 7;

function editedLabel(value?: string) {
  if (!value) return "Not edited yet";
  const date = new Date(value);
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "Edited just now";
  if (minutes < 60) return `Edited ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Edited ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Edited yesterday";
  if (days < 7) return `Edited ${days}d ago`;
  return `Edited ${date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;
}

function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/3] w-full rounded-2xl bg-[#e8eaef]" />
      <div className="mt-3 h-3.5 w-2/3 rounded-full bg-[#e8eaef]" />
      <div className="mt-2 h-2.5 w-1/3 rounded-full bg-[#edeff3]" />
    </div>
  );
}

export function CanvasDashboard({
  onOpen,
  onCreate,
  onClose,
  activeCanvasId,
  canReturn,
  refreshToken = 0,
}: CanvasDashboardProps) {
  const { user, logout } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const coarsePointer = useCoarsePointer();
  const [canvases, setCanvases] = useState<CanvasSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const refresh = useCallback(async () => {
    try {
      setCanvases(await listCanvases());
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't load your canvases",
      );
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void refresh();
  }, [refresh, refreshToken]);

  useEffect(() => {
    if (!canReturn) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canReturn, onClose]);

  const handleCreate = async () => {
    setBusy("create");
    try {
      onCreate(
        await createCanvas({
          title: "Untitled canvas",
          shapes: [],
          viewport: { x: 0, y: 0, scale: 1 },
        }),
      );
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't create a canvas",
      );
      setBusy(null);
    }
  };

  const handleOpen = async (id: string) => {
    setBusy(`open:${id}`);
    try {
      onOpen(await getCanvas(id));
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't open that canvas",
      );
      setBusy(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    const choice = await confirm({
      title: `Delete “${title}”?`,
      description:
        "The board and everything drawn on it will be gone for good. This can't be undone.",
      confirmLabel: "Delete board",
      cancelLabel: "Keep it",
      tone: "danger",
    });
    if (choice !== "confirm") return;

    setBusy(`delete:${id}`);
    try {
      await deleteCanvas(id);
      await refresh();
      toast.success(`“${title}” deleted`);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't delete that canvas",
      );
    } finally {
      setBusy(null);
    }
  };

  const term = query.trim().toLowerCase();
  const filtered = term
    ? canvases.filter((c) => c.title.toLowerCase().includes(term))
    : canvases;

  const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? "?";

  return (
    <div
      className="absolute inset-0 z-50 overflow-y-auto overscroll-contain bg-[#f4f5f7]"
      style={{
        // Same dot grid as the board, so the library feels like part of the
        // tool rather than a separate admin screen.
        backgroundImage:
          "radial-gradient(circle, #d7dbe3 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        paddingTop: "var(--safe-top)",
        paddingBottom: "var(--safe-bottom)",
        paddingLeft: "var(--safe-left)",
        paddingRight: "var(--safe-right)",
      }}
    >
      <div className="mx-auto w-full max-w-[84rem] px-5 pb-20 pt-6 sm:px-8 sm:pt-10">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9aa0ad]">
              Glazia
            </p>
            <h1 className="mt-1.5 font-display text-[1.75rem] font-semibold leading-none tracking-tight text-[#1c202a] sm:text-[2.25rem]">
              Canvases
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {canReturn ? (
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-[#3f4555] transition hover:bg-[#e6e9ef]"
              >
                <ArrowLeft size={16} strokeWidth={1.8} />
                <span className="hidden sm:inline">Back to board</span>
              </button>
            ) : null}

            <span
              className="flex h-9 w-9 select-none items-center justify-center rounded-full bg-[#1c202a] text-sm font-semibold text-white"
              title={user?.name ?? undefined}
              aria-hidden="true"
            >
              {initial}
            </span>
            <button
              type="button"
              onClick={() => void logout()}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#6b7285] transition hover:bg-[#e6e9ef] hover:text-[#1c202a]"
              aria-label={`Log out${user?.name ? ` ${user.name}` : ""}`}
              title="Log out"
            >
              <LogOut size={17} strokeWidth={1.8} />
            </button>
          </div>
        </header>

        <div className="mt-7 flex flex-col gap-4 border-b border-[#dfe3ea] pb-4 sm:flex-row sm:items-end sm:justify-between">
          <p className="text-sm text-[#6b7285]">
            {loading
              ? "Loading…"
              : canvases.length === 0
                ? "Nothing here yet"
                : `${canvases.length} ${
                    canvases.length === 1 ? "board" : "boards"
                  } · autosaves as you draw`}
          </p>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
            {canvases.length >= SEARCH_THRESHOLD ? (
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter…"
                aria-label="Filter canvases by title"
                className="h-10 w-full min-w-0 rounded-full bg-white px-4 text-base text-[#1c202a] shadow-[0_1px_2px_rgba(28,32,42,0.06)] outline-none ring-1 ring-[#e2e5eb] transition placeholder:text-[#9aa0ad] focus:ring-2 focus:ring-[#1c202a]/20 sm:w-52 sm:text-sm"
              />
            ) : null}
            {/* The empty state carries this action itself; two of them on one
                screen is noise. */}
            {loading || canvases.length > 0 ? (
              <button
                type="button"
                onClick={handleCreate}
                disabled={busy !== null}
                className="flex h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#1c202a] px-5 text-sm font-medium text-white shadow-[0_6px_20px_rgba(28,32,42,0.18)] transition hover:bg-[#2b3140] active:scale-[0.98] disabled:opacity-50 sm:h-10 sm:w-auto"
              >
                <Plus size={17} strokeWidth={2.2} />
                New canvas
              </button>
            ) : null}
          </div>
        </div>

        {loading ? (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 lg:gap-x-5 lg:gap-y-7 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="w-full max-w-xs overflow-hidden rounded-2xl ring-1 ring-[#e2e5eb]">
              <div className="aspect-[4/3]">
                <CanvasThumbnail />
              </div>
            </div>
            <h2 className="mt-6 font-display text-xl font-semibold text-[#1c202a]">
              {term ? `No board matches “${query.trim()}”` : "A blank wall"}
            </h2>
            <p className="mt-1.5 max-w-sm text-sm text-[#6b7285]">
              {term
                ? "Try a shorter word, or clear the filter."
                : "Start a board and it lands here, saving itself as you draw."}
            </p>
            {term ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-5 h-10 rounded-full px-4 text-sm font-medium text-[#1c202a] transition hover:bg-[#e6e9ef]"
              >
                Clear filter
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreate}
                disabled={busy !== null}
                className="mt-6 flex h-11 items-center gap-1.5 rounded-full bg-[#1c202a] px-5 text-sm font-medium text-white shadow-[0_6px_20px_rgba(28,32,42,0.18)] transition hover:bg-[#2b3140] disabled:opacity-50"
              >
                <Plus size={17} strokeWidth={2.2} />
                New canvas
              </button>
            )}
          </div>
        ) : (
          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 lg:gap-x-5 lg:gap-y-7 xl:grid-cols-4">
            {filtered.map((item) => {
              const active = item.id === activeCanvasId;
              const opening = busy === `open:${item.id}`;

              return (
                <li key={item.id} className="group/card">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => handleOpen(item.id)}
                      disabled={busy !== null}
                      aria-label={`Open ${item.title}`}
                      className={`block w-full overflow-hidden rounded-2xl bg-white text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c202a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f5f7] disabled:cursor-wait ${
                        active
                          ? "ring-2 ring-[#1c202a]"
                          : "ring-1 ring-[#e2e5eb] group-hover/card:-translate-y-0.5 group-hover/card:shadow-[0_14px_34px_rgba(28,32,42,0.13)] group-hover/card:ring-[#c9cfda]"
                      }`}
                    >
                      <div className="aspect-[4/3]">
                        <CanvasThumbnail
                          shapes={item.preview}
                          bounds={item.previewBounds}
                        />
                      </div>
                      {opening ? (
                        <span className="absolute inset-0 grid place-items-center bg-white/55 text-xs font-medium text-[#3f4555]">
                          Opening…
                        </span>
                      ) : null}
                    </button>

                    {active ? (
                      <span className="pointer-events-none absolute bottom-2.5 left-2.5 rounded-full bg-[#1c202a] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
                        Open
                      </span>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => void handleDelete(item.id, item.title)}
                      disabled={busy !== null}
                      aria-label={`Delete ${item.title}`}
                      // Hover can't be relied on for touch, so on coarse
                      // pointers the control simply stays visible.
                      className={`absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-[#6b7285] shadow-[0_2px_8px_rgba(28,32,42,0.12)] ring-1 ring-black/5 backdrop-blur transition hover:bg-white hover:text-[#c92a2a] focus-visible:opacity-100 disabled:opacity-40 ${
                        coarsePointer
                          ? "opacity-70"
                          : "opacity-0 group-hover/card:opacity-100"
                      }`}
                    >
                      {busy === `delete:${item.id}` ? (
                        <LoaderCircle size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} strokeWidth={1.8} />
                      )}
                    </button>
                  </div>

                  <div className="mt-3 px-0.5">
                    <p className="truncate font-display text-sm font-semibold leading-snug text-[#1c202a] lg:text-[15px]">
                      {item.title}
                    </p>
                    <p className="mt-1 truncate text-[10px] uppercase tracking-[0.06em] text-[#9aa0ad] lg:text-[11px]">
                      <span className="hidden lg:inline">
                        {item.shapeCount === 0
                          ? "Empty"
                          : `${item.shapeCount} ${
                              item.shapeCount === 1 ? "shape" : "shapes"
                            }`}
                        {" · "}
                      </span>
                      {editedLabel(item.updatedAt)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
