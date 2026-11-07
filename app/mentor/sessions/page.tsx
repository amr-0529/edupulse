import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { ActionButton } from "@/components/ActionButton";
import { MeetingLinkForm } from "@/components/session-ui";
import { cancelSessionAction, completeSessionAction, respondSessionAction } from "@/app/actions/sessions";
import { durationMins, formatDate, formatSlt, safeHttpsLink } from "@/lib/format";
import type { FeedbackRow, SessionRow, SessionStatus } from "@/lib/types";

const TONE: Record<SessionStatus, "ok" | "warn" | "bad" | "muted"> = {
  pending: "warn", accepted: "ok", declined: "bad", cancelled: "muted", completed: "ok",
};

export default async function MentorSessions() {
  const me = await requireRole("mentor");
  const supabase = await createClient();
  const { data, error } = await supabase.from("sessions")
    .select("id, slot_id, student_id, mentor_id, starts_at, ends_at, topic_note, status, meeting_link, created_at")
    .eq("mentor_id", me.id).order("starts_at", { ascending: true });
  const sessions = (data ?? []) as SessionRow[];

  const ids = Array.from(new Set(sessions.map((s) => s.student_id)));
  const names = new Map<string, string>();
  if (ids.length) {
    const { data: ps } = await supabase.from("profiles").select("id, full_name").in("id", ids);
    (ps ?? []).forEach((p) => names.set(p.id, p.full_name));
  }
  const { data: fbData } = await supabase.from("feedback").select("*").eq("mentor_id", me.id).order("created_at", { ascending: false });
  const feedback = (fbData ?? []) as FeedbackRow[];
  const avg = feedback.length ? feedback.reduce((a, f) => a + f.rating, 0) / feedback.length : null;
  const fnames = new Map<string, string>();
  const fids = Array.from(new Set(feedback.map((f) => f.student_id).filter((i) => !names.has(i))));
  if (fids.length) {
    const { data: ps } = await supabase.from("profiles").select("id, full_name").in("id", fids);
    (ps ?? []).forEach((p) => fnames.set(p.id, p.full_name));
  }

  const now = new Date().getTime();
  const pending = sessions.filter((s) => s.status === "pending" && new Date(s.starts_at).getTime() > now);
  const upcoming = sessions.filter((s) => s.status === "accepted" && new Date(s.starts_at).getTime() > now);
  const needsCompletion = sessions.filter((s) => s.status === "accepted" && new Date(s.starts_at).getTime() <= now);
  const shown = new Set([...pending, ...upcoming, ...needsCompletion].map((s) => s.id));
  const history = sessions.filter((s) => !shown.has(s.id)).sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  const who = (s: SessionRow) => names.get(s.student_id) ?? "Student";

  const Head = ({ s }: { s: SessionRow }) => (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <p className="font-semibold">{who(s)}</p>
        <p className="text-sm text-muted">{formatSlt(s.starts_at)} · {durationMins(s.starts_at, s.ends_at)} min</p>
      </div>
      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[s.status] === "ok" ? "bg-soft text-brand" : TONE[s.status] === "warn" ? "bg-soft text-warn" : "bg-soft text-danger"}`}>{s.status}</span>
    </div>
  );
  const Topic = ({ s }: { s: SessionRow }) => (
    <p className="mt-2 whitespace-pre-wrap text-sm"><span className="text-muted">Topic: </span>{s.topic_note}</p>
  );

  return (
    <>
      <h1 className="text-3xl font-extrabold">Sessions</h1>
      {error && <p className="field-error mt-2" role="alert">Sessions could not be loaded. Please refresh.</p>}

      <h2 className="mt-6 text-xl font-bold">Pending requests</h2>
      <div className="mt-3 space-y-3">
        {pending.length === 0 && <div className="card text-center"><p className="font-semibold">No pending session requests</p></div>}
        {pending.map((s) => (
          <div key={s.id} className="card">
            <Head s={s} /><Topic s={s} />
            <div className="mt-3 flex flex-wrap gap-2">
              <ActionButton label="Accept" pendingLabel="Accepting…" action={respondSessionAction.bind(null, s.id, true)} />
              <ActionButton variant="outline" label="Decline" pendingLabel="Declining…" confirmText="Decline this session request? The slot reopens." action={respondSessionAction.bind(null, s.id, false)} />
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-xl font-bold">Upcoming sessions</h2>
      <div className="mt-3 space-y-3">
        {upcoming.length === 0 && <div className="card text-center"><p className="font-semibold">No upcoming sessions</p></div>}
        {upcoming.map((s) => (
          <div key={s.id} className="card">
            <Head s={s} /><Topic s={s} />
            {safeHttpsLink(s.meeting_link) && <p className="mt-2 text-sm"><a href={safeHttpsLink(s.meeting_link)!} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand underline">Open meeting link ↗</a></p>}
            <MeetingLinkForm sessionId={s.id} current={s.meeting_link} />
            <div className="mt-3">
              <ActionButton variant="outline" label="Cancel session" pendingLabel="Cancelling…" confirmText="Cancel this session? The slot reopens." action={cancelSessionAction.bind(null, s.id)} />
            </div>
          </div>
        ))}
      </div>

      {needsCompletion.length > 0 && (
        <>
          <h2 className="mt-8 text-xl font-bold">Mark as completed</h2>
          <p className="text-sm text-muted">These sessions have started. Mark them completed so the student can leave feedback.</p>
          <div className="mt-3 space-y-3">
            {needsCompletion.map((s) => (
              <div key={s.id} className="card">
                <Head s={s} /><Topic s={s} />
                <div className="mt-3"><ActionButton label="Mark completed" pendingLabel="Saving…" action={completeSessionAction.bind(null, s.id)} /></div>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="mt-8 text-xl font-bold">Past and closed</h2>
      <div className="mt-3 space-y-3">
        {history.length === 0 && <div className="card text-center"><p className="font-semibold">No past sessions yet</p></div>}
        {history.map((s) => <div key={s.id} className="card"><Head s={s} /><Topic s={s} /></div>)}
      </div>

      <h2 className="mt-8 text-xl font-bold">Feedback received</h2>
      <p className="mt-1 text-sm">{avg === null ? <span className="text-muted">No reviews yet</span> : <span><span className="text-warn">★</span> {Math.round(avg * 10) / 10} ({feedback.length})</span>}</p>
      <div className="mt-3 space-y-3">
        {feedback.length === 0 && <div className="card text-center"><p className="font-semibold">No feedback yet</p><p className="mt-2 text-sm text-muted">Students can rate a session after you mark it completed.</p></div>}
        {feedback.map((f) => (
          <div key={f.id} className="card py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold">{names.get(f.student_id) ?? fnames.get(f.student_id) ?? "Student"}</span>
              <span className="text-xs text-muted">{formatDate(f.created_at)}</span>
            </div>
            <div className="text-warn">{"★".repeat(f.rating)}<span className="text-line">{"★".repeat(5 - f.rating)}</span></div>
            {f.comment && <p className="mt-1 whitespace-pre-wrap text-sm">{f.comment}</p>}
          </div>
        ))}
      </div>
    </>
  );
}