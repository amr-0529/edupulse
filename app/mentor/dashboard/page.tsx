import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { getUnreadCount } from "@/lib/queries";
import { Badge, Rating } from "@/components/Shell";
import { durationMins, formatSlt } from "@/lib/format";

export default async function MentorDashboard() {
  const me = await requireRole("mentor");
  const supabase = await createClient();
  
  const [{ data: mp }, { data: conns }, { count: openSlots }, unread, { data: sess }, { data: fb }] = await Promise.all([
    supabase.from("mentor_profiles").select("*").eq("id", me.id).single(),
    supabase.from("connections").select("status").eq("mentor_id", me.id),
    supabase.from("availability_slots").select("id", { count: "exact", head: true }).eq("mentor_id", me.id).eq("status", "open").gt("ends_at", new Date().toISOString()),
    getUnreadCount(supabase, me.id),
    supabase.from("sessions").select("id, student_id, status, starts_at, ends_at").eq("mentor_id", me.id).in("status", ["pending", "accepted"]).gt("ends_at", new Date().toISOString()).order("starts_at"),
    supabase.from("feedback").select("rating").eq("mentor_id", me.id),
  ]);
  
  const isProfileIncomplete = !mp?.headline?.trim() || !(mp?.category_id || mp?.custom_category) || (mp?.skills?.length ?? 0) === 0 || !mp?.bio?.trim() || !mp?.linkedin_url?.trim();

  if (isProfileIncomplete) {
    redirect("/mentor/profile?incomplete=true");
  }

  const pending = (conns ?? []).filter((c) => c.status === "pending").length;
  const status = mp?.approval_status ?? "pending";
  
  const ratings = (fb ?? []).map((f) => f.rating);
  const avg = ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null;

  const pendingSessions = (sess ?? []).filter((x) => x.status === "pending").length;
  const upcomingSessions = (sess ?? []).filter((x) => x.status === "accepted").length;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Welcome, {me.full_name.split(" ")[0]}</h1>
          <p className="text-muted mt-1">Manage your mentoring activities and connect with students.</p>
        </div>
        <Link href="/mentor/availability" className="btn btn-sm">+ Add New Availability</Link>
      </div>

      {status === "pending" && (
        <div className="card mb-6 border-warn bg-warn/5 flex items-start gap-4">
          <div className="text-2xl pt-1">⚠️</div>
          <div>
            <h3 className="font-bold text-warn">Awaiting Administrator Approval</h3>
            <p className="text-sm text-muted mt-1">
              Your profile is currently under review by the admin. You will not appear in student searches until approved.
            </p>
          </div>
        </div>
      )}

      {status === "rejected" && (
        <div className="card mb-6 border-danger bg-danger/5 flex items-start gap-4">
          <div className="text-2xl pt-1">🚫</div>
          <div>
            <h3 className="font-bold text-danger">Application Rejected</h3>
            <p className="text-sm text-muted mt-1">
              Your mentor application was not approved. Please contact the EduPulse administrators for details or update your profile.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="card bg-gradient-to-br from-brand/10 to-transparent border-brand/20">
          <p className="text-sm text-muted">Open Slots</p>
          <p className="text-3xl font-extrabold text-brand">{openSlots ?? 0}</p>
          <Link href="/mentor/availability" className="text-xs text-brand underline mt-1 inline-block">Manage slots</Link>
        </div>
        <div className="card">
          <p className="text-sm text-muted">Pending Requests</p>
          <p className="text-3xl font-extrabold">{pending}</p>
          <Link href="/mentor/requests" className="text-xs text-brand underline mt-1 inline-block">Review requests</Link>
        </div>
        <div className="card">
          <p className="text-sm text-muted">Sessions</p>
          <p className="text-3xl font-extrabold">{upcomingSessions + pendingSessions}</p>
          <Link href="/mentor/sessions" className="text-xs text-brand underline mt-1 inline-block">Manage sessions</Link>
        </div>
        <div className="card">
          <p className="text-sm text-muted">Your Rating</p>
          <p className="text-2xl font-extrabold mt-1"><Rating avg={avg} count={ratings.length} /></p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Profile Completeness</h2>
            <Badge tone={isProfileIncomplete ? "warn" : "ok"}>
              {5 - [ !mp?.headline?.trim(), !(mp?.category_id || mp?.custom_category), (mp?.skills?.length ?? 0) === 0, !mp?.bio?.trim(), !mp?.linkedin_url?.trim() ].filter(Boolean).length}/5
            </Badge>
          </div>
          <ul className="space-y-2 text-sm">
            <li className={mp?.headline?.trim() ? "text-brand" : "text-muted"}>{mp?.headline?.trim() ? "✓" : "○"} Headline added</li>
            <li className={(mp?.category_id || mp?.custom_category) ? "text-brand" : "text-muted"}>{(mp?.category_id || mp?.custom_category) ? "✓" : "○"} Mentoring field chosen</li>
            <li className={(mp?.skills?.length ?? 0) > 0 ? "text-brand" : "text-muted"}>{(mp?.skills?.length ?? 0) > 0 ? "✓" : "○"} At least one skill</li>
            <li className={mp?.bio?.trim() ? "text-brand" : "text-muted"}>{mp?.bio?.trim() ? "✓" : "○"} Bio written</li>
            <li className={mp?.linkedin_url?.trim() ? "text-brand" : "text-muted"}>{mp?.linkedin_url?.trim() ? "✓" : "○"} LinkedIn profile added</li>
          </ul>
          {!mp?.accepting_students && <p className="mt-4 text-sm text-warn font-semibold">You are currently hidden from discovery (not accepting students).</p>}
          <Link href="/mentor/profile" className="btn btn-outline btn-sm mt-4">Edit Profile</Link>
        </div>

        <div className="card">
          <h2 className="font-bold mb-4">Upcoming Schedule</h2>
          {(sess ?? []).filter((x) => x.status === "accepted").length === 0 ? (
            <p className="text-sm text-muted">Nothing scheduled.</p>
          ) : (
            <ul className="space-y-3">
              {(sess ?? []).filter((x) => x.status === "accepted").map((x) => (
                <li key={x.id} className="flex items-start justify-between border-b border-line pb-2 last:border-0">
                  <div>
                    <p className="font-semibold text-sm">{formatSlt(x.starts_at)}</p>
                    <p className="text-xs text-muted">{durationMins(x.starts_at, x.ends_at)} minutes</p>
                  </div>
                  <Badge tone="ok">accepted</Badge>
                </li>
              ))}
            </ul>
          )}
          <Link href="/mentor/sessions" className="btn btn-outline btn-sm mt-4">Manage sessions</Link>
        </div>
      </div>
    </div>
  );
}