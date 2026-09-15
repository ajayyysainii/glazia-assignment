"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
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
  /** Ask for a value alongside the decision, e.g. a name. */
  input?: {
    label: string;
    placeholder?: string;
    defaultValue?: string;
    maxLength?: number;
  };
};

export type ConfirmResult = {
  choice: ConfirmChoice;
  /** Trimmed input value; empty string when the dialog had no input. */
  value: string;
};

type ConfirmFn = (request: ConfirmRequest) => Promise<ConfirmResult>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

type PendingDialog = ConfirmRequest & {
  resolve: (result: ConfirmResult) => void;
};

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingDialog | null>(null);
  const [value, setValue] = useState("");
  const confirmRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef("");
  const previousFocus = useRef<HTMLElement | null>(null);
  const inputId = useId();

  valueRef.current = value;

  const confirm = useCallback<ConfirmFn>(
    (request) =>
      new Promise<ConfirmResult>((resolve) => {
        previousFocus.current = document.activeElement as HTMLElement | null;
        setValue(request.input?.defaultValue ?? "");
        setPending({ ...request, resolve });
      }),
    [],
  );

  const settle = useCallback(
    (choice: ConfirmChoice) => {
      setPending((current) => {
        current?.resolve({ choice, value: valueRef.current.trim() });
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
    // When there is something to fill in, that is where the cursor belongs.
    if (pending.input) {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else {
      confirmRef.current?.focus();
    }

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

            {pending.input ? (
              // Not a <form>: with the buttons outside it, implicit submission
              // never fires, so Enter is handled on the field itself.
              <div className="mt-4">
                <label
                  htmlFor={inputId}
                  className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9aa0ad]"
                >
                  {pending.input.label}
                </label>
                <input
                  ref={inputRef}
                  id={inputId}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      settle("confirm");
                    }
                  }}
                  placeholder={pending.input.placeholder}
                  maxLength={pending.input.maxLength ?? 120}
                  className="mt-1.5 w-full rounded-xl bg-[#f4f5f7] px-3.5 py-3 text-base text-[#1c202a] outline-none ring-1 ring-transparent transition placeholder:text-[#9aa0ad] focus:bg-white focus:ring-[#1c202a]/25 sm:py-2.5 sm:text-sm"
                />
              </div>
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
