"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";
import { feedbackSchema, fieldErrorsFrom, meetingLinkSchema, reportSchema, sessionRequestSchema } from "@/lib/validation";
import type { ActionState } from "@/lib/types";

const uuid = z.string().uuid();
const bad = (m = "Session not found."): ActionState => ({ ok: false, error: m });

function refresh() {
  revalidatePath("/student", "layout");
  revalidatePath("/mentor", "layout");
  revalidatePath("/admin", "layout");
}

export async function requestSessionAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = sessionRequestSchema.safeParse({ slotId: fd.get("slotId"), topic: fd.get("topic") ?? "" });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.rpc("request_session", { p_slot_id: parsed.data.slotId, p_topic: parsed.data.topic });
  refresh();
  if (error) return { ok: false, error: friendlyError(error) };
  return { ok: true, message: "Session requested. The mentor will accept or decline it." };
}

export async function respondSessionAction(sessionId: string, accept: boolean): Promise<ActionState> {
  if (!uuid.safeParse(sessionId).success) return bad();
  const supabase = await createClient();
  const { error } = await supabase.rpc("respond_session", { p_session_id: sessionId, p_accept: accept });
  refresh();
  if (error) return { ok: false, error: friendlyError(error) };
  return { ok: true, message: accept ? "Session accepted." : "Session declined." };
}

export async function cancelSessionAction(sessionId: string): Promise<ActionState> {
  if (!uuid.safeParse(sessionId).success) return bad();
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_session", { p_session_id: sessionId });
  refresh();
  if (error) return { ok: false, error: friendlyError(error) };
  return { ok: true, message: "Session cancelled." };
}

export async function completeSessionAction(sessionId: string): Promise<ActionState> {
  if (!uuid.safeParse(sessionId).success) return bad();
  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_session", { p_session_id: sessionId });
  refresh();
  if (error) return { ok: false, error: friendlyError(error) };
  return { ok: true, message: "Session marked as completed." };
}

export async function setMeetingLinkAction(sessionId: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  if (!uuid.safeParse(sessionId).success) return bad();
  const link = meetingLinkSchema.safeParse(String(fd.get("link") ?? ""));
  if (!link.success) return { ok: false, fieldErrors: { link: link.error.issues[0].message } };
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_meeting_link", { p_session_id: sessionId, p_link: link.data });
  refresh();
  if (error) return { ok: false, error: friendlyError(error) };
  return { ok: true, message: link.data ? "Meeting link saved." : "Meeting link removed." };
}

export async function submitFeedbackAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = feedbackSchema.safeParse({ sessionId: fd.get("sessionId"), rating: fd.get("rating"), comment: fd.get("comment") ?? "" });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_feedback", { p_session_id: parsed.data.sessionId, p_rating: parsed.data.rating, p_comment: parsed.data.comment });
  refresh();
  if (error) return { ok: false, error: friendlyError(error) };
  return { ok: true, message: "Thank you! Your feedback was saved." };
}

export async function reportUserAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = reportSchema.safeParse({ userId: fd.get("userId"), reason: fd.get("reason") ?? "" });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.rpc("report_user", { p_user_id: parsed.data.userId, p_reason: parsed.data.reason });
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Report sent. An administrator will review it." };
}

export async function removeConnectionAction(connectionId: string): Promise<ActionState> {
  if (!uuid.safeParse(connectionId).success) return bad("Connection not found.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_connection", { p_connection_id: connectionId });
  refresh();
  if (error) return { ok: false, error: friendlyError(error) };
  return { ok: true, message: "Connection removed. Chat history stays readable." };
}