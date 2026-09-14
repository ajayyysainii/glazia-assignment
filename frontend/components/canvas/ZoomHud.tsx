type ZoomHudProps = {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
};

export function ZoomHud({
  scale,
  onZoomIn,
  onZoomOut,
  onResetView,
}: ZoomHudProps) {
  const percent = Math.round(scale * 100);

  return (
    <div className="absolute bottom-5 left-5 z-20 flex items-center gap-1 rounded-2xl bg-white/95 p-1.5 shadow-[0_10px_40px_rgba(28,32,42,0.12)] ring-1 ring-black/5 backdrop-blur">
      <button
        type="button"
        onClick={onZoomOut}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-lg text-[#3f4555] transition hover:bg-[#eef0f4]"
        title="Zoom out"
        aria-label="Zoom out"
      >
        −
      </button>
      <button
        type="button"
        onClick={onResetView}
        className="min-w-[4.25rem] rounded-xl px-2 py-2 text-center text-sm font-medium tabular-nums text-[#1c202a] transition hover:bg-[#eef0f4]"
        title="Reset view"
      >
        {percent}%
      </button>
      <button
        type="button"
        onClick={onZoomIn}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-lg text-[#3f4555] transition hover:bg-[#eef0f4]"
        title="Zoom in"
        aria-label="Zoom in"
      >
        +
      </button>
    </div>
  );
}
