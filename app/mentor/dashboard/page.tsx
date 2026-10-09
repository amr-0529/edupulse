import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export default async function MentorDashboard() {
  const me = await requireRole("mentor");
  const supabase = await createClient();

  const [{ data: conns }, { count: openSlots }] = await Promise.all([
    supabase.from("connections").select("id, status").eq("mentor_id", me.id),
    supabase
      .from("availability_slots")
      .select("id", { count: "exact", head: true })
      .eq("mentor_id", me.id)
      .eq("status", "open")
      .gt("ends_at", new Date().toISOString()),
  ]);

  const pending = (conns ?? []).filter((c) => c.status === "pending").length;
  const accepted = (conns ?? []).filter((c) => c.status === "accepted").length;

  return (
    <>
      <p className="font-bold text-brand">MENTOR SPACE</p>
      <h1 className="text-3xl font-extrabold">Welcome, {me.full_name.split(" ")[0]}</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-3xl font-extrabold">{pending}</p>
          <p className="text-sm text-muted">Pending requests</p>
        </div>
        <div className="card">
          <p className="text-3xl font-extrabold">{accepted}</p>
          <p className="text-sm text-muted">Connected students</p>
        </div>
        <div className="card">
          <p className="text-3xl font-extrabold">{openSlots ?? 0}</p>
          <p className="text-sm text-muted">Open availability slots</p>
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="font-semibold">Next actions</h2>
        <p className="mt-1 text-sm text-muted">
          Review new connection requests from students.
        </p>
        <Link href="/mentor/requests" className="btn mt-4">
          Review requests
        </Link>
      </div>
    </>
  );
}