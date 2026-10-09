"use client";

import type { ActionState } from "@/lib/types";

export function SubmitButton({
  children,
  pending: label = "Please wait…",
  className = "",
  isPending,
}: {
  children: React.ReactNode;
  pending?: string;
  className?: string;
  isPending?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      aria-busy={isPending}
    >
      {isPending ? label : children}
    </button>
  );
}

export function FieldError({ state, name }: { state: ActionState; name: string }) {
  const msg = state.fieldErrors?.[name];
  if (!msg) return null;
  return (
    <p id={`${name}-error`} className="mt-1 text-sm font-medium text-red-600" role="alert">
      {msg}
    </p>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  if (state.error) {
    return (
      <p className="mt-3 text-sm font-medium text-red-600" role="alert">
        {state.error}
      </p>
    );
  }
  if (state.ok && state.message) {
    return (
      <p className="mt-3 text-sm font-semibold text-emerald-700" role="status">
        {state.message}
      </p>
    );
  }
  return null;
}