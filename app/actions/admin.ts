"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";
import { categorySchema } from "@/lib/validation";
import type { ActionState } from "@/lib/types";

const uuid = z.string().uuid();

export async function reviewMentorAction(mentorId: string, decision: "approved" | "rejected"): Promise<ActionState> {
  if (!uuid.safeParse(mentorId).success || !["approved", "rejected"].includes(decision)) return { ok: false, error: "Invalid request." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_review_mentor", { p_mentor_id: mentorId, p_decision: decision });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/admin", "layout");
  return { ok: true, message: decision === "approved" ? "Mentor approved and now listed." : "Mentor rejected." };
}

export async function setActiveAction(userId: string, active: boolean): Promise<ActionState> {
  if (!uuid.safeParse(userId).success) return { ok: false, error: "Invalid request." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_active", { p_user_id: userId, p_active: active });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/admin", "layout");
  return { ok: true, message: active ? "Account reactivated." : "Account deactivated." };
}

export async function resolveReportAction(reportId: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  if (!uuid.safeParse(reportId).success) return { ok: false, error: "Report not found." };
  const note = String(fd.get("note") ?? "").trim();
  if (note.length > 500) return { ok: false, fieldErrors: { note: "The note must be 500 characters or fewer." } };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_resolve_report", { p_report_id: reportId, p_note: note });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Report resolved." };
}

export async function saveCategoryAction(categoryId: string, active: boolean, _p: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = categorySchema.safeParse({ name: fd.get("name") ?? "" });
  if (!parsed.success) return { ok: false, fieldErrors: { name: parsed.error.issues[0].message } };
  const isNew = categoryId === "new";
  if (!isNew && !uuid.safeParse(categoryId).success) return { ok: false, error: "Category not found." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_save_category", { p_id: isNew ? null : categoryId, p_name: parsed.data.name, p_active: active });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/admin", "layout");
  revalidatePath("/mentor/profile");
  return { ok: true, message: isNew ? "Category added." : "Category saved." };
}

export async function setCategoryActiveAction(categoryId: string, name: string, active: boolean): Promise<ActionState> {
  if (!uuid.safeParse(categoryId).success) return { ok: false, error: "Category not found." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_save_category", { p_id: categoryId, p_name: name, p_active: active });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/admin", "layout");
  revalidatePath("/mentor/profile");
  return { ok: true, message: active ? "Category activated." : "Category deactivated." };
}