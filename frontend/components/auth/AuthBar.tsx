"use client";

import { useEffect, useState } from "react";
import { LogOut, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { LoginModal } from "./LoginModal";
import { SignupModal } from "./SignupModal";

export type AuthMode = "login" | "signup" | null;

type AuthBarProps = {
  mode?: AuthMode;
  onModeChange?: (mode: AuthMode) => void;
};

export function AuthBar({ mode: controlledMode, onModeChange }: AuthBarProps) {
  const { user, loading, logout } = useAuth();
  const [internalMode, setInternalMode] = useState<AuthMode>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const mode = controlledMode ?? internalMode;
  const setMode = (next: AuthMode) => {
    onModeChange?.(next);
    if (controlledMode === undefined) setInternalMode(next);
  };

  useEffect(() => {
    if (user) setMode(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <div
        className="absolute right-3 top-3 z-30 flex items-center gap-2 lg:right-5 lg:top-5"
        style={{
          marginTop: "var(--safe-top)",
          marginRight: "var(--safe-right)",
        }}
      >
        {loading ? (
          <div className="rounded-2xl bg-white/90 px-3 py-2.5 text-sm text-[#6b7285] shadow-[0_8px_30px_rgba(28,32,42,0.08)] ring-1 ring-black/5 backdrop-blur sm:px-4">
            Checking…
          </div>
        ) : user ? (
          <div className="flex items-center gap-2 rounded-2xl bg-white/95 p-1.5 shadow-[0_10px_40px_rgba(28,32,42,0.12)] ring-1 ring-black/5 backdrop-blur">
            <div className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-[#1c202a] sm:px-3">
              <UserRound size={16} strokeWidth={1.8} className="text-[#6b7285]" />
              <span className="hidden max-w-[7rem] truncate font-medium sm:inline sm:max-w-[140px]">
                {user.name}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm text-[#3f4555] transition hover:bg-[#eef0f4] disabled:opacity-50 sm:h-10"
              title="Log out"
              aria-label="Log out"
            >
              <LogOut size={16} strokeWidth={1.8} />
              <span className="hidden sm:inline">
                {loggingOut ? "…" : "Log out"}
              </span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-2xl bg-white/95 p-1.5 shadow-[0_10px_40px_rgba(28,32,42,0.12)] ring-1 ring-black/5 backdrop-blur">
            <button
              type="button"
              onClick={() => setMode("login")}
              className="flex h-11 items-center justify-center rounded-xl px-3 text-sm font-medium text-[#3f4555] transition hover:bg-[#eef0f4] sm:h-10 sm:px-4"
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className="flex h-11 items-center justify-center rounded-xl bg-[#1c202a] px-3 text-sm font-medium text-white transition hover:bg-[#2b3140] sm:h-10 sm:px-4"
            >
              Sign up
            </button>
          </div>
        )}
      </div>

      <LoginModal
        open={mode === "login"}
        onClose={() => setMode(null)}
        onSwitchToSignup={() => setMode("signup")}
      />
      <SignupModal
        open={mode === "signup"}
        onClose={() => setMode(null)}
        onSwitchToLogin={() => setMode("login")}
      />
    </>
  );
}
