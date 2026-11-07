import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { ActionButton } from "@/components/ActionButton";
import { FeedbackForm } from "@/components/session-ui";
import { cancelSessionAction } from "@/app/actions/sessions";
import { durationMins, formatSlt, safeHttpsLink } from "@/lib/format";
import type { FeedbackRow, SessionRow, SessionStatus } from "@/lib/types";

const TONE: Record<SessionStatus, "ok" | "warn" | "bad" | "muted"> = {
  pending: "warn", accepted: "ok", declined: "bad", cancelled: "muted", completed: "ok",
};

export default async function StudentSessions() {
  const me = await requireRole("student");
  const supabase = await createClient();
  const { data, error } = await supabase.from("sessions")
    .select("id, slot_id, student_id, mentor_id, starts_at, ends_at, topic_note, status, meeting_link, created_at")
    .eq("student_id", me.id).order("starts_at", { ascending: false });
  const sessions = (data ?? []) as SessionRow[];

  const ids = Array.from(new Set(sessions.map((s) => s.mentor_id)));
  const names = new Map<string, string>();
  if (ids.length) {
    const { data: ps } = await supabase.from("profiles").select("id, full_name").in("id", ids);
    (ps ?? []).forEach((p) => names.set(p.id, p.full_name));
  }
  const fb = new Map<string, FeedbackRow>();
  if (sessions.length) {
    const { data: f } = await supabase.from("feedback").select("*").in("session_id", sessions.map((s) => s.id));
    ((f ?? []) as FeedbackRow[]).forEach((r) => fb.set(r.session_id, r));
  }

  const now = new Date().getTime();
  const active = sessions.filter((s) => (s.status === "pending" || s.status === "accepted") && new Date(s.ends_at).getTime() > now)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const past = sessions.filter((s) => !active.includes(s));

  const Card = ({ s }: { s: SessionRow }) => {
    const link = safeHttpsLink(s.meeting_link);
    const f = fb.get(s.id);
    const canCancel = (s.status === "pending" || s.status === "accepted") && new Date(s.starts_at).getTime() > now;
    return (
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-semibold">{names.get(s.mentor_id) ?? "Mentor"}</p>
            <p className="text-sm text-muted">{formatSlt(s.starts_at)} · {durationMins(s.starts_at, s.ends_at)} min</p>
          </div>
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[s.status] === "ok" ? "bg-soft text-brand" : TONE[s.status] === "warn" ? "bg-soft text-warn" : "bg-soft text-danger"}`}>{s.status}</span>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm"><span className="text-muted">Your note: </span>{s.topic_note}</p>
        {(s.status === "accepted" || s.status === "completed") && (
          <p className="mt-2 text-sm">
            {link ? <a href={link} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand underline">Join meeting ↗</a> : <span className="text-muted">The mentor has not added a meeting link yet.</span>}
          </p>
        )}
        {canCancel && (
          <div className="mt-3">
            <ActionButton variant="outline" label={s.status === "pending" ? "Cancel request" : "Cancel session"} pendingLabel="Cancelling…" confirmText="Cancel this session? The time slot will reopen for other students." action={cancelSessionAction.bind(null, s.id)} />
          </div>
        )}
        {s.status === "completed" && (f
          ? <div className="mt-3 rounded-xl bg-soft p-3 text-sm"><span className="text-warn">{"★".repeat(f.rating)}</span> {f.comment && <p className="mt-1 whitespace-pre-wrap">{f.comment}</p>}</div>
          : <FeedbackForm sessionId={s.id} />)}
      </div>
    );
  };

  return (
    <>
      <h1 className="text-3xl font-extrabold">My sessions</h1>
      {error && <p className="field-error mt-2" role="alert">Sessions could not be loaded. Please refresh.</p>}
      <h2 className="mt-6 text-xl font-bold">Upcoming and pending</h2>
      <div className="mt-3 space-y-3">
        {active.length === 0 && <div className="card text-center"><p className="font-semibold">No upcoming sessions</p><p className="mt-2 text-sm text-muted">Open a mentor you are connected with and request one of their open slots. <Link href="/student/discover" className="text-brand underline">Find mentors</Link></p></div>}
        {active.map((s) => <Card key={s.id} s={s} />)}
      </div>
      <h2 className="mt-8 text-xl font-bold">Past and closed</h2>
      <div className="mt-3 space-y-3">
        {past.length === 0 && <div className="card text-center"><p className="font-semibold">No past sessions yet</p></div>}
        {past.map((s) => <Card key={s.id} s={s} />)}
      </div>
    </>
  );
}