import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { ConnectPanel, type ConnState } from "@/components/ConnectPanel";
import { SessionRequestPanel, ReportUser } from "@/components/session-ui";
import { formatDate } from "@/lib/format";
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
            .eq("status", "open")
            .gt("starts_at", new Date().toISOString())
            .order("starts_at")
        ).data ?? []
      : [];

  const { data: reviewData } = await supabase.rpc("mentor_reviews", { p_mentor_id: m.id });
  const reviews = (reviewData ?? []) as { rating: number; comment: string; created_at: string; student_first_name: string }[];

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
              <dd>
                {m.review_count > 0 ? (
                  <span className="text-warn">★ {m.avg_rating} <span className="text-muted font-normal">({m.review_count})</span></span>
                ) : (
                  "No reviews yet"
                )}
              </dd>
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

          <div className="px-1">
            <ReportUser userId={m.id} name={m.full_name} />
          </div>

          <div className="card">
            <h2 className="font-semibold">Student reviews</h2>
            {reviews.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No reviews yet.</p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {reviews.map((r, i) => (
                  <li key={i}>
                    <div className="text-warn">
                      {"★".repeat(r.rating)}<span className="text-line">{"★".repeat(5 - r.rating)}</span>
                    </div>
                    {r.comment && <span className="whitespace-pre-wrap">{r.comment}</span>}{" "}
                    <span className="text-muted">— {r.student_first_name}, {formatDate(r.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h2 className="font-semibold">Availability</h2>
            {state.kind !== "accepted" ? (
              <p className="mt-2 text-sm text-muted">Connect to view availability.</p>
            ) : slots.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No open slots right now.</p>
            ) : (
              <SessionRequestPanel slots={slots} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}