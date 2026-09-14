"use client";

import { useEffect, useId, useRef, type FormEvent, type ReactNode } from "react";
import { X } from "lucide-react";

type AuthModalProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
};

export function AuthModal({
  open,
  title,
  subtitle,
  onClose,
  children,
}: AuthModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>("input")?.focus();

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#1c202a]/35 px-4 pt-24 backdrop-blur-[2px] sm:items-center sm:pt-0">
      <button
        type="button"
        aria-label="Close dialog backdrop"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_24px_80px_rgba(28,32,42,0.22)] ring-1 ring-black/5"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#6b7285] transition hover:bg-[#eef0f4] hover:text-[#1c202a]"
          aria-label="Close"
        >
          <X size={18} strokeWidth={1.8} />
        </button>

        <div className="mb-6 pr-8">
          <h2
            id={titleId}
            className="font-display text-2xl font-semibold tracking-tight text-[#1c202a]"
          >
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-[#6b7285]">{subtitle}</p>
          ) : null}
        </div>

        {children}
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
};

export function AuthField({
  label,
  name,
  type = "text",
  autoComplete,
  required = true,
  minLength,
  placeholder,
}: FieldProps) {
  const id = useId();
  return (
    <label htmlFor={id} className="block space-y-1.5">
      <span className="text-sm font-medium text-[#3f4555]">{label}</span>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#e2e5eb] bg-[#f8f9fb] px-3.5 py-2.5 text-sm text-[#1c202a] outline-none transition placeholder:text-[#9aa0ad] focus:border-[#1c202a]/30 focus:bg-white focus:ring-2 focus:ring-[#1c202a]/10"
      />
    </label>
  );
}

type AuthFormShellProps = {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  error: string | null;
  submitLabel: string;
  loading: boolean;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthFormShell({
  onSubmit,
  error,
  submitLabel,
  loading,
  children,
  footer,
}: AuthFormShellProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {children}
      {error ? (
        <p className="rounded-xl bg-[#fff1f0] px-3 py-2 text-sm text-[#c92a2a]">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="flex h-11 w-full items-center justify-center rounded-xl bg-[#1c202a] text-sm font-medium text-white transition hover:bg-[#2b3140] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Please wait…" : submitLabel}
      </button>
      <div className="pt-1 text-center text-sm text-[#6b7285]">{footer}</div>
    </form>
  );
}
