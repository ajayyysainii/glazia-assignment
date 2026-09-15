"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, Check, Info, X } from "lucide-react";

type ToastTone = "success" | "error" | "info";

type Toast = {
  id: number;
  tone: ToastTone;
  message: string;
  /** Optional single action, e.g. "Retry". */
  action?: { label: string; onAction: () => void };
};

type ToastInput = Omit<Toast, "id" | "tone">;

type ToastApi = {
  success: (message: string, options?: Partial<ToastInput>) => void;
  error: (message: string, options?: Partial<ToastInput>) => void;
  info: (message: string, options?: Partial<ToastInput>) => void;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const DURATION: Record<ToastTone, number> = {
  success: 3000,
  info: 4000,
  // Failures need long enough to read and act on.
  error: 7000,
};

/** More than a few stacked toasts is a wall of text, not feedback. */
const MAX_VISIBLE = 3;

const TONE_STYLES: Record<ToastTone, { icon: ReactNode; accent: string }> = {
  success: {
    icon: <Check size={14} strokeWidth={2.5} />,
    accent: "bg-[#2f9e44]",
  },
  error: {
    icon: <AlertTriangle size={14} strokeWidth={2.2} />,
    accent: "bg-[#ff6b6b]",
  },
  info: {
    icon: <Info size={14} strokeWidth={2.2} />,
    accent: "bg-[#74c0fc]",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (tone: ToastTone, message: string, options?: Partial<ToastInput>) => {
      const id = nextId.current++;
      setToasts((list) => [...list, { id, tone, message, ...options }].slice(-MAX_VISIBLE));
      timers.current.set(
        id,
        window.setTimeout(() => dismiss(id), DURATION[tone]),
      );
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => window.clearTimeout(timer));
      pending.clear();
    };
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message, options) => push("success", message, options),
      error: (message, options) => push("error", message, options),
      info: (message, options) => push("info", message, options),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}

      <div
        // Bottom centre on every size: the desktop toolbar owns the top edge,
        // and on phones this clears the bottom dock.
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-3"
        style={{
          paddingBottom: "calc(5.75rem + var(--safe-bottom))",
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            aria-live={toast.tone === "error" ? "assertive" : "polite"}
            className="pointer-events-auto flex w-full max-w-sm animate-[toast-in_180ms_ease-out] items-center gap-2.5 rounded-2xl bg-[#1c202a] py-2.5 pl-3 pr-2 text-white shadow-[0_14px_40px_rgba(28,32,42,0.28)]"
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#1c202a] ${
                TONE_STYLES[toast.tone].accent
              }`}
            >
              {TONE_STYLES[toast.tone].icon}
            </span>

            <p className="flex-1 text-[13px] leading-snug">{toast.message}</p>

            {toast.action ? (
              <button
                type="button"
                onClick={() => {
                  toast.action?.onAction();
                  dismiss(toast.id);
                }}
                className="h-8 shrink-0 rounded-lg px-2.5 text-[13px] font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
              >
                {toast.action.label}
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside a ToastProvider");
  }
  return context;
}
