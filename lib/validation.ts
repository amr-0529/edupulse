import { z } from "zod";

/** Validation rules from the SRS. Used on client AND server (FR-16.1). */

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be 2–60 characters.").max(60, "Name must be 2–60 characters."),
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

export const studentProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be 2–60 characters.").max(60, "Name must be 2–60 characters."),
  institution: z.string().trim().min(1, "Institution is required.").max(100),
  fieldOfStudy: z.string().trim().min(1, "Field of study is required.").max(100),
  yearOfStudy: z.string().trim().min(1, "Year of study is required.").max(30),
  interests: z.string().trim().min(1, "Add at least one interest.").max(200, "Interests: up to 200 characters."),
  bio: z.string().trim().max(500, "Bio can be up to 500 characters."),
});

export function parseSkills(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );
}

export const mentorProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be 2–60 characters.").max(60, "Name must be 2–60 characters."),
  headline: z.string().trim().min(1, "Headline is required.").max(120, "Headline: up to 120 characters."),
  jobTitle: z.string().trim().max(100),
  organisation: z.string().trim().max(100),
  education: z.string().trim().max(150),
  yearsExperience: z.coerce
    .number({ invalid_type_error: "Enter a number from 0 to 60." })
    .int("Enter a whole number.")
    .min(0, "Years must be 0–60.")
    .max(60, "Years must be 0–60."),
  categoryId: z.string().uuid("Choose a mentoring field."),
  skills: z.array(z.string().max(40, "Each skill: up to 40 characters.")).min(1, "Add at least one skill.").max(10, "Up to 10 skills."),
  bio: z.string().trim().max(800, "Bio can be up to 800 characters."),
  acceptingStudents: z.boolean(),
});

export const connectionMessageSchema = z.string().trim().max(300, "Message must be 300 characters or fewer.");

export const chatMessageSchema = z
  .string()
  .transform((s) => s.trim())
  .pipe(z.string().min(1, "Type a message first.").max(1000, "Messages can be up to 1000 characters."));

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

/** Strip characters that have meaning in PostgREST filter strings / LIKE patterns (FR-05.1: trim, max 100). */
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

// ---------------------------------------------------------------- phase 2 (sessions, feedback, reports, categories, auth)
export const sessionRequestSchema = z.object({
  slotId: z.string().uuid("Choose a time slot."),
  topic: z.string().trim().min(1, "Add a short note about what you would like to discuss.").max(500, "The note must be 500 characters or fewer."),
});

export const meetingLinkSchema = z
  .string()
  .trim()
  .max(300, "Link: up to 300 characters.")
  .refine((v) => v === "" || /^https:\/\/\S+$/.test(v), "Enter a valid link that starts with https://");

export const feedbackSchema = z.object({
  sessionId: z.string().uuid(),
  rating: z.coerce.number({ invalid_type_error: "Choose a rating from 1 to 5." }).int().min(1, "Choose a rating from 1 to 5.").max(5, "Choose a rating from 1 to 5."),
  comment: z.string().trim().max(500, "The comment must be 500 characters or fewer."),
});

export const reportSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().trim().min(1, "Please explain why you are reporting this user.").max(500, "The reason must be 500 characters or fewer."),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Category names must be 2–60 characters.").max(60, "Category names must be 2–60 characters."),
});

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.");

export const newPasswordSchema = z
  .object({
    password: registerSchema.shape.password,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "The passwords do not match." });

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_MAX_INPUT_BYTES = 10 * 1024 * 1024;
export const AVATAR_TYPES = ["image/jpeg", "image/png"] as const;
export function validateAvatarFile(type: string, size: number): string | null {
  if (!(AVATAR_TYPES as readonly string[]).includes(type)) return "Use a JPG or PNG image.";
  if (size > AVATAR_MAX_INPUT_BYTES) return "Choose an image smaller than 10 MB.";
  if (size === 0) return "The image is empty.";
  return null;
}
export function validateAvatarOutput(size: number): string | null {
  return size > AVATAR_MAX_BYTES ? "The photo is still larger than 2 MB. Please choose a smaller image." : null;
}
export function isOwnAvatarPath(userId: string, path: string): boolean {
  return new RegExp(`^${userId}/[0-9]{10,16}\\.(jpg|png)$`).test(path);
}

export function formErrors<T extends z.ZodTypeAny>(schema: T, input: unknown): Record<string, string> | null {
  const r = schema.safeParse(input);
  return r.success ? null : fieldErrorsFrom(r.error);
}
export function registerInput(fd: FormData) {
  return { fullName: fd.get("fullName") ?? "", email: fd.get("email") ?? "", password: fd.get("password") ?? "", role: fd.get("role") ?? "" };
}
export function loginInput(fd: FormData) {
  return { email: fd.get("email") ?? "", password: fd.get("password") ?? "" };
}