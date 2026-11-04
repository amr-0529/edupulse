"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";
import type { ActionState } from "@/lib/types";

const uuid = z.string().uuid();

export async function reviewMentorAction(mentorId: string, decision: "approved" | "rejected"): Promise<ActionState> {
  if (!uuid.safeParse(mentorId).success || !["approved", "rejected"].includes(decision)) {
    return { ok: false, error: "Invalid request." };
  }
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