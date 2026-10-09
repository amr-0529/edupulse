import type { PostgrestError } from "@supabase/supabase-js";

/**
 * FR-16.3: never expose technical details. Messages raised by our own RPC functions are
 * written for users, so they are passed through; everything else becomes a generic message.
 */
const USER_FACING = [
  "already sent",
  "already connected",
  "not available",
  "declined your last request",
  "Only students",
  "cannot connect with yourself",
  "300 characters",
  "already answered",
  "Slot must start",
  "cannot change your own",
  "Not allowed",
  "not found",
  "Please log in",
];

export function friendlyError(
  err: PostgrestError | { message: string; code?: string } | null
): string {
  if (!err) return "Something went wrong. Please try again.";
  const m = err.message ?? "";
  if (err.code === "23P01" || m.includes("slots_no_overlap"))
    return "This slot overlaps with one you already published.";
  if (err.code === "23505") return "That already exists.";
  if (err.code === "23514" && m.includes("slot"))
    return "A slot must be between 15 and 120 minutes.";
  if (err.code === "42501" || m.includes("row-level security"))
    return "You do not have permission to do that.";
  if (USER_FACING.some((p) => m.includes(p))) return m;
  console.error("[edupulse] unexpected database error:", err);
  return "Something went wrong. Please try again.";
}