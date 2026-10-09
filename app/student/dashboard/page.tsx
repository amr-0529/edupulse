import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export default async function StudentDashboard() {
  const me = await requireRole("student");
  const supabase = await createClient();

  const [{ data: conns }, { count: unread }] = await Promise.all([
    supabase.from("connections").select("id, status").eq("student_id", me.id),
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .is("read_at", null)
      .neq("sender_id", me.id),
  ]);

  const pending = (conns ?? []).filter((c) => c.status === "pending").length;
  const accepted = (conns ?? []).filter((c) => c.status === "accepted").length;

  return (
    <>
      <p className="font-bold text-brand">STUDENT SPACE</p>
      <h1 className="text-3xl font-extrabold">Welcome back, {me.full_name.split(" ")[0]}</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-3xl font-extrabold">{accepted}</p>
          <p className="text-sm text-muted">Connected mentors</p>
        </div>
        <div className="card">
          <p className="text-3xl font-extrabold">{pending}</p>
          <p className="text-sm text-muted">Pending requests</p>
        </div>
        <div className="card">
          <p className="text-3xl font-extrabold">{unread ?? 0}</p>
          <p className="text-sm text-muted">Unread messages</p>
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="font-semibold">Find your next mentor</h2>
        <p className="mt-1 text-sm text-muted">Search approved mentors by keyword, field and experience.</p>
        <Link href="/student/discover" className="btn mt-4">Browse mentors</Link>
      </div>
    </>
  );
}