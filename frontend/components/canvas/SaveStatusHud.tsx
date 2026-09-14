type SaveStatusHudProps = {
  status: "idle" | "saving" | "saved" | "error";
  error?: string | null;
  loggedIn: boolean;
};

// Sits under the zoom HUD on small screens, beside it on desktop.
const POSITION =
  "absolute left-3 top-[3.9rem] z-20 max-w-[min(18rem,calc(100vw_-_1.5rem))] truncate rounded-2xl px-3 py-2 text-xs shadow-[0_10px_40px_rgba(28,32,42,0.12)] ring-1 backdrop-blur lg:bottom-5 lg:left-[11.75rem] lg:top-auto";

const OFFSET = {
  marginTop: "var(--safe-top)",
  marginLeft: "var(--safe-left)",
} as const;

export function SaveStatusHud({ status, error, loggedIn }: SaveStatusHudProps) {
  if (!loggedIn) {
    return (
      <div
        className={`${POSITION} bg-white/95 text-[#6b7285] ring-black/5`}
        style={OFFSET}
      >
        Log in to auto-save
      </div>
    );
  }

  const label =
    status === "saving"
      ? "Saving…"
      : status === "saved"
        ? "Saved"
        : status === "error"
          ? error || "Save failed"
          : null;

  if (!label) return null;

  return (
    <div
      className={`${POSITION} ${
        status === "error"
          ? "bg-[#fff1f0] text-[#c92a2a] ring-[#c92a2a]/10"
          : "bg-white/95 text-[#3f4555] ring-black/5"
      }`}
      style={OFFSET}
      role="status"
    >
      {label}
    </div>
  );
}
