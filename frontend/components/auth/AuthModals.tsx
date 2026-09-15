"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { LoginModal } from "./LoginModal";
import { SignupModal } from "./SignupModal";

export type AuthMode = "login" | "signup" | null;

/**
 * The login/signup dialogs, mounted once. Triggers live wherever they make
 * sense (the profile menu, an empty state) and just set the mode.
 */
export function AuthModals({
  mode,
  onModeChange,
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
}) {
  const { user } = useAuth();

  useEffect(() => {
    if (user) onModeChange(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close on sign-in
  }, [user]);

  return (
    <>
      <LoginModal
        open={mode === "login"}
        onClose={() => onModeChange(null)}
        onSwitchToSignup={() => onModeChange("signup")}
      />
      <SignupModal
        open={mode === "signup"}
        onClose={() => onModeChange(null)}
        onSwitchToLogin={() => onModeChange("login")}
      />
    </>
  );
}
