import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";

// CSV export of admin reports (SRS 3.5, Low priority). Admin-only; RLS also restricts these tables.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Please log in.", { status: 401 });
  const { data: me } = await supabase.from("profiles").select("role, is_active").eq("id", user.id).single();
  if (!me || me.role !== "admin" || !me.is_active) return new NextResponse("Not allowed.", { status: 403 });

  const type = new URL(request.url).searchParams.get("type");
  let csv: string;
  if (type === "users") {
    const { data, error } = await supabase.rpc("admin_list_users", { p_search: "" });
    if (error) return new NextResponse("Export failed.", { status: 500 });
    csv = toCsv(["id", "name", "email", "role", "active", "mentor_status", "joined"],
      (data ?? []).map((u: Record<string, unknown>) => [u.id, u.full_name, u.email, u.role, u.is_active, u.approval_status, u.created_at]));
  } else if (type === "sessions") {
    const { data, error } = await supabase.from("sessions").select("id, student_id, mentor_id, starts_at, ends_at, status, created_at").order("starts_at", { ascending: false }).limit(5000);
    if (error) return new NextResponse("Export failed.", { status: 500 });
    csv = toCsv(["id", "student_id", "mentor_id", "starts_at", "ends_at", "status", "created_at"],
      (data ?? []).map((s) => [s.id, s.student_id, s.mentor_id, s.starts_at, s.ends_at, s.status, s.created_at]));
  } else if (type === "feedback") {
    const { data, error } = await supabase.from("feedback").select("id, session_id, mentor_id, rating, comment, created_at").order("created_at", { ascending: false }).limit(5000);
    if (error) return new NextResponse("Export failed.", { status: 500 });
    csv = toCsv(["id", "session_id", "mentor_id", "rating", "comment", "created_at"],
      (data ?? []).map((f) => [f.id, f.session_id, f.mentor_id, f.rating, f.comment, f.created_at]));
  } else if (type === "reports") {
    const { data, error } = await supabase.from("reports").select("id, reporter_id, reported_user_id, reason, status, resolution_note, created_at, resolved_at").order("created_at", { ascending: false }).limit(5000);
    if (error) return new NextResponse("Export failed.", { status: 500 });
    csv = toCsv(["id", "reporter_id", "reported_user_id", "reason", "status", "resolution_note", "created_at", "resolved_at"],
      (data ?? []).map((r) => [r.id, r.reporter_id, r.reported_user_id, r.reason, r.status, r.resolution_note, r.created_at, r.resolved_at]));
  } else {
    return new NextResponse("Unknown export type.", { status: 400 });
  }
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="edupulse-${type}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}