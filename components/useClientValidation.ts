"use client";

import { useState } from "react";
import type { ActionState } from "@/lib/types";

/**
 * FR-16.1: validate on the client with the SAME rules the server uses. If the check finds problems the form is not
 * submitted; otherwise the server action runs and validates again (the server never trusts the browser).
 */
export function useClientValidation(check: (fd: FormData) => Record<string, string> | null) {
  const [errs, setErrs] = useState<Record<string, string>>({});
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const found = check(new FormData(e.currentTarget));
    if (found) {
      e.preventDefault();
      setErrs(found);
    } else if (Object.keys(errs).length) {
      setErrs({});
    }
  };
  const merge = (state: ActionState): ActionState =>
    Object.keys(errs).length ? { ok: false, fieldErrors: { ...state.fieldErrors, ...errs } } : state;
  return { onSubmit, merge };
}