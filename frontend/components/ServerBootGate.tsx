"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { LoaderCircle, PlugZap, ServerCrash } from "lucide-react";
import { pingHealth } from "@/lib/api/health";

type Phase = "checking" | "waking" | "ready" | "unreachable";

/**
 * A warm server answers in milliseconds, so showing a loader immediately
 * would just be a flash. Nothing is rendered until the first probe has been
 * outstanding this long.
 */
const GRACE_MS = 1200;
/** Free hosts commonly take 30–60s to wake, so keep trying past that. */
const GIVE_UP_MS = 90_000;
const RETRY_MS = 2500;

export function ServerBootGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("checking");
  const [elapsed, setElapsed] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const startedAt = useRef(Date.now());
  const cancelled = useRef(false);

  const run = useCallback(async () => {
    startedAt.current = Date.now();
    cancelled.current = false;
    setPhase("checking");
    setElapsed(0);

    // Only admit to "waking" once the grace period has passed, so a healthy
    // server never flashes a loader.
    const grace = window.setTimeout(() => {
      if (!cancelled.current) setPhase((p) => (p === "checking" ? "waking" : p));
    }, GRACE_MS);

    try {
      while (!cancelled.current) {
        if (await pingHealth()) {
          if (!cancelled.current) setPhase("ready");
          return;
        }
        if (Date.now() - startedAt.current > GIVE_UP_MS) {
          if (!cancelled.current) setPhase("unreachable");
          return;
        }
        await new Promise((r) => setTimeout(r, RETRY_MS));
      }
    } finally {
      window.clearTimeout(grace);
    }
  }, []);

  useEffect(() => {
    void run();
    return () => {
      cancelled.current = true;
    };
  }, [run, attempt]);

  // Elapsed seconds, so a long wait visibly progresses instead of looking hung.
  useEffect(() => {
    if (phase !== "waking") return;
    const timer = window.setInterval(
      () => setElapsed(Math.round((Date.now() - startedAt.current) / 1000)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [phase]);

  if (phase === "ready") return <>{children}</>;

  // Still inside the grace period: render nothing rather than a flash.
  if (phase === "checking") {
    return <div className="h-dvh w-full bg-[#f4f5f7]" />;
  }

  const unreachable = phase === "unreachable";

  return (
    <main
      className="flex h-dvh w-full items-center justify-center bg-[#f4f5f7] px-6"
      style={{
        backgroundImage: "radial-gradient(circle, #d7dbe3 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <div className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-[0_24px_80px_rgba(28,32,42,0.14)] ring-1 ring-black/5">
        <span
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
            unreachable ? "bg-[#fff1f0] text-[#c92a2a]" : "bg-[#eef0f4] text-[#1c202a]"
          }`}
        >
          {unreachable ? (
            <ServerCrash size={22} strokeWidth={1.8} />
          ) : (
            <PlugZap size={22} strokeWidth={1.8} />
          )}
        </span>

        <h1 className="mt-4 font-display text-xl font-semibold tracking-tight text-[#1c202a]">
          {unreachable ? "Can't reach the server" : "Booting up the server"}
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-[#6b7285]">
          {unreachable
            ? "It didn't answer in time. It may still be starting, or the API address may be misconfigured."
            : "The API sleeps when it's idle and takes up to a minute to wake. Hang tight — this only happens on the first visit."}
        </p>

        {!unreachable ? (
          <p className="mt-4 flex items-center justify-center gap-2 text-xs tabular-nums text-[#9aa0ad]">
            <LoaderCircle size={13} className="animate-spin" />
            Waiting {elapsed}s
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2">
          {unreachable ? (
            <button
              type="button"
              onClick={() => setAttempt((a) => a + 1)}
              className="flex h-11 items-center justify-center rounded-xl bg-[#1c202a] text-sm font-medium text-white transition hover:bg-[#2b3140]"
            >
              Try again
            </button>
          ) : null}

          {/* Drawing works without the API — signed-out boards are kept on the
              device — so never trap someone behind a sleeping server. */}
          <button
            type="button"
            onClick={() => setPhase("ready")}
            className="flex h-11 items-center justify-center rounded-xl text-sm font-medium text-[#3f4555] transition hover:bg-[#eef0f4]"
          >
            Continue without the server
          </button>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-[#9aa0ad]">
          You can draw offline; boards are saved on this device until the
          server is reachable.
        </p>
      </div>
    </main>
  );
}
