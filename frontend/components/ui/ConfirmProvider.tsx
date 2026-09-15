"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ConfirmChoice = "confirm" | "alt" | "cancel";

export type ConfirmRequest = {
  title: string;
  description?: string;
  confirmLabel?: string;
  /** Optional middle option, e.g. "Discard changes". */
  altLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
};

type ConfirmFn = (request: ConfirmRequest) => Promise<ConfirmChoice>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

type PendingDialog = ConfirmRequest & {
  resolve: (choice: ConfirmChoice) => void;
};

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingDialog | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const confirm = useCallback<ConfirmFn>(
    (request) =>
      new Promise<ConfirmChoice>((resolve) => {
        previousFocus.current = document.activeElement as HTMLElement | null;
        setPending({ ...request, resolve });
      }),
    [],
  );

  const settle = useCallback(
    (choice: ConfirmChoice) => {
      setPending((current) => {
        current?.resolve(choice);
        return null;
      });
      // Send focus back where it came from, so keyboard users don't restart
      // at the top of the page.
      previousFocus.current?.focus();
    },
    [],
  );

  useEffect(() => {
    if (!pending) return;
    confirmRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        settle("cancel");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pending, settle]);

  const danger = pending?.tone === "danger";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {pending ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-[#1c202a]/40 px-4 backdrop-blur-[2px] sm:items-center"
          style={{
            paddingTop: "calc(1.5rem + var(--safe-top))",
            paddingBottom: "calc(1.5rem + var(--safe-bottom))",
          }}
        >
          <button
            type="button"
            aria-label="Cancel"
            tabIndex={-1}
            onClick={() => settle("cancel")}
            className="absolute inset-0 cursor-default"
          />

          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby={pending.description ? "confirm-body" : undefined}
            className="relative z-10 w-full max-w-md animate-[toast-in_160ms_ease-out] rounded-3xl bg-white p-5 shadow-[0_24px_80px_rgba(28,32,42,0.28)] ring-1 ring-black/5 sm:p-6"
          >
            <h2
              id="confirm-title"
              className="font-display text-xl font-semibold tracking-tight text-[#1c202a]"
            >
              {pending.title}
            </h2>
            {pending.description ? (
              <p id="confirm-body" className="mt-2 text-sm text-[#6b7285]">
                {pending.description}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => settle("cancel")}
                className="h-11 rounded-xl px-4 text-sm font-medium text-[#3f4555] transition hover:bg-[#eef0f4] sm:h-10"
              >
                {pending.cancelLabel ?? "Cancel"}
              </button>

              {pending.altLabel ? (
                <button
                  type="button"
                  onClick={() => settle("alt")}
                  className="h-11 rounded-xl px-4 text-sm font-medium text-[#c92a2a] ring-1 ring-[#c92a2a]/20 transition hover:bg-[#fff1f0] sm:h-10"
                >
                  {pending.altLabel}
                </button>
              ) : null}

              <button
                ref={confirmRef}
                type="button"
                onClick={() => settle("confirm")}
                className={`h-11 rounded-xl px-4 text-sm font-medium text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:h-10 ${
                  danger
                    ? "bg-[#c92a2a] hover:bg-[#b02525] focus-visible:ring-[#c92a2a]"
                    : "bg-[#1c202a] hover:bg-[#2b3140] focus-visible:ring-[#1c202a]"
                }`}
              >
                {pending.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used inside a ConfirmProvider");
  }
  return context;
}
