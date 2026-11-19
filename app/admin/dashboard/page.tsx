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

function StatCard({ title, value, subtitle, icon }: { title: string; value: number; subtitle: string; icon: string }) {
  return (
    <div className="card flex items-start gap-4 hover:border-brand transition-colors">
      <div className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-soft text-2xl">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-muted">{title}</p>
        <p className="text-3xl font-extrabold">{value}</p>
        <p className="text-xs text-muted">{subtitle}</p>
      </div>
    </div>
  );
}

export default async function AdminDashboard() {
  await requireRole("admin");
  
  const [students, mentors, admins, inactive, pendingMentors, pendingConn, acceptedConn, openReports, sPending, sCompleted] = await Promise.all([
    count("profiles", { column: "role", value: "student" }),
    count("profiles", { column: "role", value: "mentor" }),
    count("profiles", { column: "role", value: "admin" }),
    count("profiles", { column: "is_active", value: false }),
    count("mentor_profiles", { column: "approval_status", value: "pending" }),
    count("connections", { column: "status", value: "pending" }),
    count("connections", { column: "status", value: "accepted" }),
    count("reports", { column: "status", value: "open" }),
    count("sessions", { column: "status", value: "pending" }),
    count("sessions", { column: "status", value: "completed" }),
  ]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Platform Overview</h1>
        <p className="text-muted mt-1">Monitor system health, manage users, and moderate content.</p>
      </div>

      {/* Action Required Section */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-warn animate-pulse"></span> Action Required
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card bg-gradient-to-r from-warn/10 to-transparent border-warn/30 flex items-center justify-between">
            <div>
              <p className="font-semibold text-warn">Mentors Awaiting Review</p>
              <p className="text-sm text-muted">New mentors need approval before being listed.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-extrabold text-warn">{pendingMentors}</span>
              <Link href="/admin/approvals" className="btn btn-sm">Review</Link>
            </div>
          </div>
          
          <div className="card bg-gradient-to-r from-warn/10 to-transparent border-warn/30 flex items-center justify-between">
            <div>
              <p className="font-semibold text-warn">Open Reports</p>
              <p className="text-sm text-muted">User reports waiting for moderation.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-extrabold text-warn">{openReports}</span>
              <Link href="/admin/reports" className="btn btn-sm">Resolve</Link>
            </div>
          </div>
        </div>
      </section>

      {/* System Health Section */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3">System Health</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <StatCard title="Total Students" value={students} subtitle="Registered accounts" icon="🎓" />
          <StatCard title="Active Mentors" value={mentors} subtitle="Approved and active" icon="🧑‍🏫" />
          <StatCard title="Connections" value={acceptedConn} subtitle="Accepted pairings" icon="🤝" />
          <StatCard title="Deactivated" value={inactive} subtitle="Accounts restricted" icon="🚫" />
        </div>
      </section>

      {/* Activity Section */}
      <section>
        <h2 className="text-lg font-bold mb-3">Recent Activity</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard title="Pending Connections" value={pendingConn} subtitle="Waiting for mentor" icon="⏳" />
          <StatCard title="Pending Sessions" value={sPending} subtitle="Waiting for mentor" icon="📅" />
          <StatCard title="Completed Sessions" value={sCompleted} subtitle="All-time mentorship" icon="✅" />
        </div>
      </section>
    </div>
  );
}