import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { ConnectPanel, type ConnState } from "@/components/ConnectPanel";
import { formatSlt } from "@/lib/format";
import type { MentorCard } from "@/lib/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function MentorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireRole("student");
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const { data } = await supabase.from("mentor_directory").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();

  const m = data as MentorCard;

  const { data: last } = await supabase
    .from("connections")
    .select("id, status, responded_at")
    .eq("student_id", me.id)
    .eq("mentor_id", m.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let state: ConnState = { kind: "none" };
  if (last?.status === "pending") state = { kind: "pending", id: last.id };
  else if (last?.status === "accepted") state = { kind: "accepted", id: last.id };
  else if (last?.status === "declined" && last.responded_at) {
    state = {
      kind: "declined",
      retryAt: new Date(new Date(last.responded_at).getTime() + 7 * 864e5).toISOString(),
    };
  }

  const slots =
    state.kind === "accepted"
      ? (
          await supabase
            .from("availability_slots")
            .select("id, starts_at, ends_at")
            .eq("mentor_id", m.id)
            .order("starts_at")
        ).data ?? []
      : [];

  return (
    <>
      <Link href="/student/discover" className="text-sm text-brand underline">
        ← Back to mentors
      </Link>

      <div className="mt-4 grid gap-6 md:grid-cols-[1fr_20rem]">
        <div className="card">
          <div className="flex items-center gap-4">
            <div
              aria-hidden
              className="grid h-14 w-14 flex-none place-items-center rounded-full border border-line bg-soft text-xl font-bold text-brand"
            >
              {m.full_name.trim().charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">{m.full_name}</h1>
              <p className="text-muted">{m.headline}</p>
              <p className="text-xs font-semibold text-brand">✓ Approved by administrator</p>
            </div>
          </div>

          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Current role</dt>
              <dd>{[m.job_title, m.organisation].filter(Boolean).join(" at ") || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Experience</dt>
              <dd>{m.years_experience} years</dd>
            </div>
            <div>
              <dt className="text-muted">Education</dt>
              <dd>{m.education || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Rating</dt>
              <dd>No reviews yet</dd>
            </div>
          </dl>

          <h2 className="mt-5 font-semibold">About</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm">{m.bio || "No bio provided."}</p>

          <h2 className="mt-5 font-semibold">Mentoring field & skills</h2>
          <div className="mt-1">
            <span className="chip">{m.category_name}</span>
            {m.skills.map((s) => (
              <span key={s} className="chip">
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h2 className="mb-3 font-semibold">Connect</h2>
            <ConnectPanel mentorId={m.id} state={state} />
          </div>

          <div className="card">
            <h2 className="font-semibold">Availability</h2>
            {state.kind !== "accepted" ? (
              <p className="mt-2 text-sm text-muted">Connect to view availability.</p>
            ) : slots.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No open slots right now.</p>
            ) : (
              <>
                <ul className="mt-2 space-y-1 text-sm">
                  {slots.map((s) => (
                    <li key={s.id}>{formatSlt(s.starts_at)}</li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-muted">Session requests are planned for the next phase.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}