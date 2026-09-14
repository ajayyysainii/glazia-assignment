"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { AuthApiError } from "@/lib/auth/api";
import { AuthField, AuthFormShell, AuthModal } from "./AuthModal";

type SignupModalProps = {
  open: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
};

export function SignupModal({
  open,
  onClose,
  onSwitchToLogin,
}: SignupModalProps) {
  const { signup } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    try {
      await signup({ name, email, password });
      onClose();
    } catch (err) {
      if (err instanceof AuthApiError && err.errors) {
        const first = Object.values(err.errors).flat().find(Boolean);
        setError(first ?? err.message);
      } else {
        setError(
          err instanceof AuthApiError
            ? err.message
            : "Unable to sign up. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthModal
      open={open}
      title="Create account"
      subtitle="Sign up to keep your drawings saved."
      onClose={onClose}
    >
      <AuthFormShell
        onSubmit={handleSubmit}
        error={error}
        submitLabel="Sign up"
        loading={loading}
        footer={
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-medium text-[#1c202a] underline-offset-2 hover:underline"
            >
              Log in
            </button>
          </>
        }
      >
        <AuthField
          label="Name"
          name="name"
          autoComplete="name"
          minLength={2}
          placeholder="Your name"
        />
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
          autoComplete="new-password"
          minLength={8}
          placeholder="At least 8 characters"
        />
      </AuthFormShell>
    </AuthModal>
  );
}
