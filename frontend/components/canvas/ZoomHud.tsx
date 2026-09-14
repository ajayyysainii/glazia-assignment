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
    <div
      // Top-left on small screens (the toolbar owns the bottom edge there),
      // bottom-left once the toolbar moves to the top on desktop.
      className="absolute left-3 top-3 z-20 flex items-center gap-1 rounded-2xl bg-white/95 p-1 shadow-[0_10px_40px_rgba(28,32,42,0.12)] ring-1 ring-black/5 backdrop-blur lg:bottom-5 lg:left-5 lg:top-auto lg:p-1.5"
      style={{
        marginTop: "var(--safe-top)",
        marginLeft: "var(--safe-left)",
      }}
    >
      <button
        type="button"
        onClick={onZoomOut}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-lg text-[#3f4555] transition hover:bg-[#eef0f4] lg:h-9 lg:w-9"
        title="Zoom out"
        aria-label="Zoom out"
      >
        −
      </button>
      <button
        type="button"
        onClick={onResetView}
        className="min-w-[3.5rem] rounded-xl px-1.5 py-2 text-center text-sm font-medium tabular-nums text-[#1c202a] transition hover:bg-[#eef0f4] lg:min-w-[4.25rem] lg:px-2"
        title="Reset view"
        aria-label={`Zoom ${percent} percent. Reset view`}
      >
        {percent}%
      </button>
      <button
        type="button"
        onClick={onZoomIn}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-lg text-[#3f4555] transition hover:bg-[#eef0f4] lg:h-9 lg:w-9"
        title="Zoom in"
        aria-label="Zoom in"
      >
        +
      </button>
    </div>
  );
}
