"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";
import { slotToIso, validateSlot } from "@/lib/validation";
import type { ActionState } from "@/lib/types";

export async function addSlotAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const date = String(fd.get("date") ?? "");
  const start = String(fd.get("start") ?? "");
  const end = String(fd.get("end") ?? "");
  const problem = validateSlot(date, start, end);
  if (problem) return { ok: false, error: problem };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please log in first." };

  const { error } = await supabase.from("availability_slots").insert({
    mentor_id: user.id, starts_at: slotToIso(date, start), ends_at: slotToIso(date, end),
  });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/mentor/availability");
  return { ok: true, message: "Slot published." };
}

export async function removeSlotAction(slotId: string): Promise<ActionState> {
  if (!z.string().uuid().safeParse(slotId).success) return { ok: false, error: "Slot not found." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("availability_slots").delete().eq("id", slotId).eq("status", "open").select("id");
  if (error) return { ok: false, error: friendlyError(error) };
  if (!data?.length) return { ok: false, error: "A booked slot cannot be removed." };
  revalidatePath("/mentor/availability");
  return { ok: true, message: "Slot removed." };
}

export async function editSlotAction(slotId: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  if (!z.string().uuid().safeParse(slotId).success) return { ok: false, error: "Slot not found." };
  const date = String(fd.get("date") ?? "");
  const start = String(fd.get("start") ?? "");
  const end = String(fd.get("end") ?? "");
  const problem = validateSlot(date, start, end);
  if (problem) return { ok: false, error: problem };
  const supabase = await createClient();
  const { data, error } = await supabase.from("availability_slots")
    .update({ starts_at: slotToIso(date, start), ends_at: slotToIso(date, end) })
    .eq("id", slotId).eq("status", "open").select("id");
  if (error) return { ok: false, error: friendlyError(error) };
  if (!data?.length) return { ok: false, error: "A booked slot cannot be edited. Cancel the session first." };
  revalidatePath("/mentor/availability");
  return { ok: true, message: "Slot updated." };
}