"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ActionState } from "@/lib/types";

export function ActionButton({
  action,
  label,
  pendingLabel = "Please wait…",
  variant = "solid",
  confirmText,
}: {
  action: () => Promise<ActionState>;
  label: string;
  pendingLabel?: string;
  variant?: "solid" | "outline" | "danger";
  confirmText?: string;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionState | null>(null);
  const router = useRouter();
  const cls =
    variant === "outline"
      ? "btn btn-outline btn-sm"
      : variant === "danger"
        ? "btn btn-danger btn-sm"
        : "btn btn-sm";

  return (
    <span className="inline-flex flex-col items-start">
      <button
        type="button"
        className={cls}
        disabled={pending}
        onClick={() => {
          if (confirmText && !window.confirm(confirmText)) return;
          start(async () => {
            setResult(await action());
            router.refresh();
          });
        }}
      >
        {pending ? pendingLabel : label}
      </button>
      {result?.error && (
        <span className="field-error mt-1" role="alert">
          {result.error}
        </span>
      )}
    </span>
  );
}