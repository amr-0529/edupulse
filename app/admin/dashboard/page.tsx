import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

type Filter = { column: string; value: string | boolean };

async function count(table: string, filter?: Filter) {
  const supabase = await createClient();
  let q = supabase.from(table).select("id", { count: "exact", head: true });
  if (filter) q = q.eq(filter.column, filter.value);
  const { count: c } = await q;
  return c ?? 0;
}

export default async function AdminDashboard() {
  await requireRole("admin");
  
  const [students, mentors, admins, inactive, pendingMentors, pendingConn, acceptedConn, declinedConn] = await Promise.all([
    count("profiles", { column: "role", value: "student" }),
    count("profiles", { column: "role", value: "mentor" }),
    count("profiles", { column: "role", value: "admin" }),
    count("profiles", { column: "is_active", value: false }),
    count("mentor_profiles", { column: "approval_status", value: "pending" }),
    count("connections", { column: "status", value: "pending" }),
    count("connections", { column: "status", value: "accepted" }),
    count("connections", { column: "status", value: "declined" }),
  ]);

  const Stat = ({ n, l }: { n: number; l: string }) => (
    <div className="card">
      <p className="text-3xl font-extrabold">{n}</p>
      <p className="text-sm text-muted">{l}</p>
    </div>
  );

  return (
    <>
      <p className="font-bold text-brand">ADMINISTRATION</p>
      <h1 className="text-3xl font-extrabold">Platform overview</h1>
      
      <h2 className="mt-6 font-semibold">Users</h2>
      <div className="mt-2 grid gap-4 sm:grid-cols-4">
        <Stat n={students} l="Students" />
        <Stat n={mentors} l="Mentors" />
        <Stat n={admins} l="Administrators" />
        <Stat n={inactive} l="Deactivated" />
      </div>
      
      <h2 className="mt-6 font-semibold">Connections</h2>
      <div className="mt-2 grid gap-4 sm:grid-cols-3">
        <Stat n={pendingConn} l="Pending" />
        <Stat n={acceptedConn} l="Accepted" />
        <Stat n={declinedConn} l="Declined" />
      </div>
      
      <div className="card mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">Mentors awaiting review</p>
          <p className="text-sm text-muted">New mentors are listed only after approval (FR-15.6).</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${pendingMentors ? "bg-soft text-warn" : "bg-soft text-brand"}`}>
            {pendingMentors} pending
          </span>
          <Link href="/admin/approvals" className="btn btn-sm">Review</Link>
        </div>
      </div>
      
      <p className="mt-4 text-xs text-muted">Session statistics and reports are planned for a later phase.</p>
    </>
  );
}