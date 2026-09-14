"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { AuthApiError } from "@/lib/auth/api";
import { AuthField, AuthFormShell, AuthModal } from "./AuthModal";

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
};

export function LoginModal({ open, onClose, onSwitchToSignup }: LoginModalProps) {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    try {
      await login({ email, password });
      onClose();
    } catch (err) {
      setError(
        err instanceof AuthApiError
          ? err.message
          : "Unable to log in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthModal
      open={open}
      title="Welcome back"
      subtitle="Log in to save and sync your canvases."
      onClose={onClose}
    >
      <AuthFormShell
        onSubmit={handleSubmit}
        error={error}
        submitLabel="Log in"
        loading={loading}
        footer={
          <>
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="font-medium text-[#1c202a] underline-offset-2 hover:underline"
            >
              Sign up
            </button>
          </>
        }
      >
        <AuthField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
        />
        <AuthField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={8}
          placeholder="••••••••"
        />
      </AuthFormShell>
    </AuthModal>
  );
}
