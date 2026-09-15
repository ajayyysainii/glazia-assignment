type SaveStatusHudProps = {
  status: "idle" | "saving" | "saved" | "error";
  loggedIn: boolean;
  /** Signed out and the device refused to store the board. */
  storageBlocked?: boolean;
};

// Sits under the zoom HUD on small screens, beside it on desktop.
const POSITION =
  "absolute left-3 top-[3.9rem] z-20 max-w-[min(18rem,calc(100vw_-_1.5rem))] truncate rounded-2xl px-3 py-2 text-xs shadow-[0_10px_40px_rgba(28,32,42,0.12)] ring-1 backdrop-blur lg:bottom-5 lg:left-[11.75rem] lg:top-auto";

const OFFSET = {
  marginTop: "var(--safe-top)",
  marginLeft: "var(--safe-left)",
} as const;

// Ambient state only. Failures are raised as toasts, where they can carry a
// retry and can't be mistaken for a passive label.
export function SaveStatusHud({
  status,
  loggedIn,
  storageBlocked = false,
}: SaveStatusHudProps) {
  if (!loggedIn) {
    // Signed-out boards are kept in this browser, so say so rather than
    // implying nothing is being saved at all.
    return (
      <div
        className={`${POSITION} ${
          storageBlocked
            ? "bg-[#fff1f0] text-[#c92a2a] ring-[#c92a2a]/10"
            : "bg-white/95 text-[#6b7285] ring-black/5"
        }`}
        style={OFFSET}
      >
        {storageBlocked ? "Not saved — storage blocked" : "Saved on this device"}
      </div>
    );
  }

  const label =
    status === "saving" ? "Saving…" : status === "saved" ? "Saved" : null;

  if (!label) return null;

  return (
    <div
      className={`${POSITION} bg-white/95 text-[#3f4555] ring-black/5`}
      style={OFFSET}
      role="status"
    >
      {label}
    </div>
  );
}
