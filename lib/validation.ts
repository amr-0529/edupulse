import { z } from "zod";

/** Validation rules from the SRS. Used on client AND server (FR-16.1). */

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be 2-60 characters.").max(60, "Name must be 2-60 characters."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password needs 8+ characters with a letter and a number.")
    .regex(/[A-Za-z]/, "Password needs 8+ characters with a letter and a number.")
    .regex(/\d/, "Password needs 8+ characters with a letter and a number."),
  role: z.enum(["student", "mentor"], { errorMap: () => ({ message: "Choose Student or Mentor." }) }),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const chatMessageSchema = z
  .string()
  .transform((s) => s.trim())
  .pipe(z.string().min(1, "Type a message first.").max(1000, "Messages can be up to 1000 characters."));

/** Strip characters that have meaning in PostgREST filter strings / LIKE patterns. */
export function sanitizeSearch(q: string): string {
  return q.replace(/[%,()*\\_"']/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
}

export function fieldErrorsFrom(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const k = String(issue.path[0] ?? "form");
    if (!out[k]) out[k] = issue.message;
  }
  return out;
}

/** SRS FR-10.1: future slot, end after start, 15–120 minutes. Times are Sri Lanka time (UTC+05:30, no DST). */
export function slotToIso(date: string, time: string): string {
  return `${date}T${time}:00+05:30`;
}

export function validateSlot(date: string, start: string, end: string, now: Date = new Date()): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
    return "Enter a date, start time and end time.";
  }
  const s = new Date(slotToIso(date, start));
  const e = new Date(slotToIso(date, end));
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "Enter a valid date and time.";
  if (s <= now) return "The slot must be in the future.";
  if (e <= s) return "End time must be after start time.";
  const mins = (e.getTime() - s.getTime()) / 60000;
  if (mins < 15 || mins > 120) return "A slot must be between 15 and 120 minutes.";
  return null;
}