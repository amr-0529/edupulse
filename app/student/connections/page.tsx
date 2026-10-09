import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { ActionButton } from "@/components/ActionButton";
import { cancelConnectionRequest } from "@/app/actions/connections";
import { formatDate } from "@/lib/format";

type Row = {
  id: string;
  status: "pending" | "accepted" | "declined";
  intro_message: string;
  created_at: string;
  mentor_id: string;
  mentor: { full_name: string } | { full_name: string }[] | null;
};

function one<T>(x: T | T[] | null | undefined): T | null {
  if (!x) return null;
  return Array.isArray(x) ? x[0] ?? null : x;
}

export default async function StudentConnections() {
  const me = await requireRole("student");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("connections")
    .select(
      "id, status, intro_message, created_at, mentor_id, mentor:profiles!connections_mentor_id_fkey(full_name)"
    )
    .eq("student_id", me.id)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <h1 className="text-3xl font-extrabold">My connections</h1>

      {error && (
        <p className="field-error mt-3" role="alert">
          Connections could not be loaded. Please refresh.
        </p>
      )}

      {!error && rows.length === 0 && (
        <div className="card mt-4 text-center">
          <p className="font-semibold">No requests yet</p>
          <p className="mt-2 text-sm text-muted">
            <Link href="/student/discover" className="text-brand underline">
              Find a mentor
            </Link>{" "}
            and send your first request.
          </p>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {rows.map((c) => {
          const name = one(c.mentor)?.full_name ?? "Mentor";
          return (
            <div key={c.id} className="card flex flex-wrap items-center gap-4">
              <div
                aria-hidden
                className="grid h-11 w-11 flex-none place-items-center rounded-full border border-line bg-soft text-lg font-bold text-brand"
              >
                {name.trim().charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/student/mentors/${c.mentor_id}`} className="font-semibold hover:underline">
                  {name}
                </Link>
                <p className="truncate text-sm text-muted">
                  {c.intro_message || "No intro message"} · sent {formatDate(c.created_at)}
                </p>
              </div>
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  c.status === "accepted"
                    ? "bg-soft text-brand"
                    : c.status === "pending"
                      ? "bg-soft text-warn"
                      : "bg-soft text-danger"
                }`}
              >
                {c.status}
              </span>
              {c.status === "pending" && (
                <ActionButton
                  variant="outline"
                  label="Cancel"
                  pendingLabel="Cancelling…"
                  action={cancelConnectionRequest.bind(null, c.id)}
                  confirmText="Cancel this request?"
                />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}