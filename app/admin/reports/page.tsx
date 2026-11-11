import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { ActionButton } from "@/components/ActionButton";
import { ResolveReportForm } from "@/components/session-ui";
import { setActiveAction } from "@/app/actions/admin";
import { formatDate } from "@/lib/format";

type Report = {
  id: string; reporter_id: string; reported_user_id: string; reason: string; status: "open" | "resolved";
  resolved_at: string | null; resolution_note: string; created_at: string;
};

function weekStart(iso: string): string {
  const d = new Date(iso);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

export default async function AdminReports() {
  await requireRole("admin");
  const supabase = await createClient();
  const [{ data: rep, error }, { data: fb }, { data: ses }] = await Promise.all([
    supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("feedback").select("mentor_id, rating").limit(2000),
    supabase.from("sessions").select("status, starts_at").limit(5000),
  ]);
  const reports = (rep ?? []) as Report[];

  const ids = Array.from(new Set([...reports.flatMap((r) => [r.reporter_id, r.reported_user_id]), ...(fb ?? []).map((f) => f.mentor_id)]));
  const info = new Map<string, { name: string; active: boolean; role: string }>();
  if (ids.length) {
    const { data: ps } = await supabase.from("profiles").select("id, full_name, is_active, role").in("id", ids);
    (ps ?? []).forEach((p) => info.set(p.id, { name: p.full_name, active: p.is_active, role: p.role }));
  }
  const nm = (id: string) => info.get(id)?.name ?? "Unknown user";

  const per = new Map<string, { sum: number; n: number }>();
  (fb ?? []).forEach((f) => { const c = per.get(f.mentor_id) ?? { sum: 0, n: 0 }; c.sum += f.rating; c.n += 1; per.set(f.mentor_id, c); });
  const totalN = (fb ?? []).length;
  const overall = totalN ? Math.round(((fb ?? []).reduce((a, f) => a + f.rating, 0) / totalN) * 10) / 10 : null;
  const mentors = Array.from(per.entries()).map(([id, c]) => ({ id, avg: Math.round((c.sum / c.n) * 10) / 10, n: c.n })).sort((a, b) => b.avg - a.avg || b.n - a.n);

  const weeks = new Map<string, number>();
  (ses ?? []).forEach((s) => { const w = weekStart(s.starts_at); weeks.set(w, (weeks.get(w) ?? 0) + 1); });
  const weekRows = Array.from(weeks.entries()).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 8);

  const open = reports.filter((r) => r.status === "open");
  const done = reports.filter((r) => r.status === "resolved");

  return (
    <>
      <h1 className="text-3xl font-extrabold">Reports &amp; moderation</h1>
      {error && <p className="field-error mt-2" role="alert">Reports could not be loaded. Please refresh.</p>}

      <h2 className="mt-6 text-xl font-bold">Open user reports ({open.length})</h2>
      <div className="mt-3 space-y-3">
        {open.length === 0 && !error && <div className="card text-center"><p className="font-semibold">No open reports</p></div>}
        {open.map((r) => {
          const target = info.get(r.reported_user_id);
          return (
            <div key={r.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm"><span className="font-semibold">{nm(r.reporter_id)}</span> reported <span className="font-semibold">{nm(r.reported_user_id)}</span>{target ? ` (${target.role})` : ""}</p>
                <span className="text-xs text-muted">{formatDate(r.created_at)}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{r.reason}</p>
              <ResolveReportForm reportId={r.id} />
              {target?.active && (
                <div className="mt-2">
                  <ActionButton variant="danger" label="Deactivate reported user" pendingLabel="…" confirmText={`Deactivate ${target.name}? They will no longer be able to log in.`} action={setActiveAction.bind(null, r.reported_user_id, false)} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <h2 className="mt-8 text-xl font-bold">Resolved reports</h2>
      <div className="mt-3 space-y-3">
        {done.length === 0 && <div className="card text-center"><p className="font-semibold">No resolved reports yet</p></div>}
        {done.map((r) => (
          <div key={r.id} className="card py-3 text-sm">
            <p><span className="font-semibold">{nm(r.reporter_id)}</span> → <span className="font-semibold">{nm(r.reported_user_id)}</span> <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold bg-soft text-brand">resolved {r.resolved_at ? formatDate(r.resolved_at) : ""}</span></p>
            <p className="mt-1 whitespace-pre-wrap">{r.reason}</p>
            {r.resolution_note && <p className="mt-1 text-muted">Note: {r.resolution_note}</p>}
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-xl font-bold">Feedback summary</h2>
      <p className="mt-1 text-sm">Overall: {overall === null ? "No reviews yet" : `★ ${overall} (${totalN})`}</p>
      <div className="mt-3 overflow-x-auto">
        {mentors.length === 0 ? <div className="card text-center"><p className="font-semibold">No feedback yet</p></div> : (
          <table className="w-full min-w-[24rem] text-left text-sm">
            <thead className="text-muted"><tr><th className="p-2">Mentor</th><th className="p-2">Average</th><th className="p-2">Reviews</th></tr></thead>
            <tbody>{mentors.map((m) => <tr key={m.id} className="border-t border-line"><td className="p-2 font-semibold">{nm(m.id)}</td><td className="p-2">{m.avg.toFixed(1)}</td><td className="p-2">{m.n}</td></tr>)}</tbody>
          </table>
        )}
      </div>

      <h2 className="mt-8 text-xl font-bold">Sessions per week</h2>
      <div className="mt-3 overflow-x-auto">
        {weekRows.length === 0 ? <div className="card text-center"><p className="font-semibold">No sessions yet</p></div> : (
          <table className="w-full min-w-[20rem] text-left text-sm">
            <thead className="text-muted"><tr><th className="p-2">Week starting (Mon)</th><th className="p-2">Sessions</th></tr></thead>
            <tbody>{weekRows.map(([w, n]) => <tr key={w} className="border-t border-line"><td className="p-2">{w}</td><td className="p-2">{n}</td></tr>)}</tbody>
          </table>
        )}
      </div>

      <h2 className="mt-8 text-xl font-bold">Export (CSV)</h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {["users", "sessions", "feedback", "reports"].map((t) => (
          <Link key={t} href={`/admin/export?type=${t}`} prefetch={false} className="btn btn-outline btn-sm" download>{t}.csv</Link>
        ))}
      </div>
    </>
  );
}