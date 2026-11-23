"use client";

import { useState } from "react";
import type { ActionState } from "@/lib/types";

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
  
  const merge = (state: ActionState): ActionState => {
    if (Object.keys(errs).length) {
      return { 
        ok: false, 
        error: "Please fix the errors below before saving.",
        fieldErrors: { ...state.fieldErrors, ...errs } 
      };
    }
    return state;
  };
  
  return { onSubmit, merge };
}