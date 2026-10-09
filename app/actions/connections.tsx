"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";
import type { ActionState } from "@/lib/types";

const uuid = z.string().uuid();

export async function sendConnectionRequest(mentorId: string, message: string): Promise<ActionState> {
  if (!uuid.safeParse(mentorId).success) return { ok: false, error: "Mentor not found." };
  if (message.length > 300) return { ok: false, error: "Message must be 300 characters or fewer." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("send_connection_request", {
    p_mentor_id: mentorId,
    p_message: message.trim(),
  });
  if (error) return { ok: false, error: friendlyError(error) };

  revalidatePath(`/student/mentors/${mentorId}`);
  revalidatePath("/student/connections");
  return { ok: true, message: "Connection request sent." };
}

export async function cancelConnectionRequest(connectionId: string): Promise<ActionState> {
  if (!uuid.safeParse(connectionId).success) return { ok: false, error: "Request not found." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("connections")
    .delete()
    .eq("id", connectionId)
    .eq("status", "pending")
    .select("id");
  if (error) return { ok: false, error: friendlyError(error) };
  if (!data || data.length === 0) {
    return { ok: false, error: "This request was already answered, so it cannot be cancelled." };
  }

  revalidatePath("/student", "layout");
  return { ok: true, message: "Request cancelled." };
}

export async function respondConnection(connectionId: string, accept: boolean): Promise<ActionState> {
  if (!uuid.safeParse(connectionId).success) return { ok: false, error: "Request not found." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("respond_connection", {
    p_connection_id: connectionId,
    p_accept: accept,
  });

  revalidatePath("/mentor", "layout");
  if (error) return { ok: false, error: friendlyError(error) };
  return {
    ok: true,
    message: accept ? "Request accepted. This student is now a connection." : "Request declined.",
  };
}