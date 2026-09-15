"use client";

import { useEffect, useRef, useState } from "react";
import { LayoutGrid, LogOut, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { AuthMode } from "./AuthModals";

type ProfileMenuProps = {
  /** "rail" sits in the right-hand column; "bar" floats in a corner. */
  variant: "rail" | "bar";
  onRequestAuth: (mode: AuthMode) => void;
  onBrowseAll?: () => void;
  className?: string;
};

export function ProfileMenu({
  variant,
  onRequestAuth,
  onBrowseAll,
  className = "",
}: ProfileMenuProps) {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!user) setOpen(false);
  }, [user]);

  const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? null;
  const isRail = variant === "rail";

  const shell =
    "rounded-2xl bg-white/95 p-1.5 shadow-[0_10px_40px_rgba(28,32,42,0.12)] ring-1 ring-black/5 backdrop-blur";

  if (loading) {
    return (
      <div className={`${shell} ${className}`}>
        <div className="flex h-10 items-center justify-center px-2 text-xs text-[#9aa0ad]">
          …
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`${shell} ${className}`}>
        <div className={isRail ? "flex flex-col gap-1" : "flex items-center gap-1"}>
          <button
            type="button"
            onClick={() => onRequestAuth("login")}
            className="flex h-10 items-center justify-center rounded-xl px-3 text-sm font-medium text-[#3f4555] transition hover:bg-[#eef0f4]"
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => onRequestAuth("signup")}
            className="flex h-10 items-center justify-center rounded-xl bg-[#1c202a] px-3 text-sm font-medium text-white transition hover:bg-[#2b3140]"
          >
            Sign up
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div className={shell}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Account: ${user.name}`}
          className={`flex h-10 w-full items-center gap-2 rounded-xl px-1.5 text-left transition hover:bg-[#eef0f4] ${
            open ? "bg-[#eef0f4]" : ""
          }`}
        >
          <span className="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full bg-[#1c202a] text-xs font-semibold text-white">
            {initial ?? <UserRound size={14} strokeWidth={2} />}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#1c202a]">
            {user.name}
          </span>
        </button>
      </div>

      {open ? (
        <div
          role="menu"
          // The rail hugs the right edge, so its menu opens inward.
          className={`absolute z-40 w-60 overflow-hidden rounded-2xl bg-white p-1.5 shadow-[0_18px_50px_rgba(28,32,42,0.20)] ring-1 ring-black/5 ${
            isRail
              ? "bottom-0 right-[calc(100%+0.5rem)]"
              : "right-0 top-[calc(100%+0.5rem)]"
          }`}
        >
          <div className="px-2.5 py-2">
            <p className="truncate font-display text-sm font-semibold text-[#1c202a]">
              {user.name}
            </p>
            <p className="mt-0.5 truncate text-xs text-[#6b7285]">
              {user.email}
            </p>
          </div>

          <div className="my-1 h-px bg-[#eef0f4]" />

          {onBrowseAll ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onBrowseAll();
              }}
              className="flex h-10 w-full items-center gap-2.5 rounded-xl px-2.5 text-sm text-[#3f4555] transition hover:bg-[#f4f5f7] hover:text-[#1c202a]"
            >
              <LayoutGrid size={16} strokeWidth={1.8} />
              All canvases
            </button>
          ) : null}

          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              setLoggingOut(true);
              try {
                await logout();
              } finally {
                setLoggingOut(false);
                setOpen(false);
              }
            }}
            disabled={loggingOut}
            className="flex h-10 w-full items-center gap-2.5 rounded-xl px-2.5 text-sm text-[#3f4555] transition hover:bg-[#f4f5f7] hover:text-[#1c202a] disabled:opacity-50"
          >
            <LogOut size={16} strokeWidth={1.8} />
            {loggingOut ? "Logging out…" : "Log out"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
