import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { one } from "@/lib/queries";
import { ActionButton } from "@/components/ActionButton";
import { cancelConnectionRequest } from "@/app/actions/connections";
import { removeConnectionAction } from "@/app/actions/sessions";
import { formatDate } from "@/lib/format";

type Row = { id: string; status: "pending" | "accepted" | "declined" | "removed"; intro_message: string; created_at: string; responded_at: string | null; mentor_id: string; mentor: { full_name: string } | { full_name: string }[] | null };

export default async function StudentConnections() {
  const me = await requireRole("student");
  const supabase = await createClient();
  const { data, error } = await supabase.from("connections")
    .select("id, status, intro_message, created_at, responded_at, mentor_id, mentor:profiles!connections_mentor_id_fkey(full_name)")
    .eq("student_id", me.id).order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <h1 className="text-3xl font-extrabold">My connections</h1>
      {error && <p className="field-error mt-3" role="alert">Connections could not be loaded. Please refresh.</p>}
      <div className="mt-4 space-y-3">
        {rows.length === 0 && !error && <div className="card text-center"><p className="font-semibold">No requests yet</p><p className="mt-2 text-sm text-muted"><Link href="/student/discover" className="text-brand underline">Find a mentor</Link> and send your first request.</p></div>}
        {rows.map((c) => {
          const name = one(c.mentor)?.full_name ?? "Mentor";
          return (
            <div key={c.id} className="card flex flex-wrap items-center gap-4">
              <div aria-hidden className="grid h-11 w-11 flex-none place-items-center rounded-full border border-line bg-soft text-lg font-bold text-brand">
                {name.trim().charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/student/mentors/${c.mentor_id}`} className="font-semibold hover:underline">{name}</Link>
                <p className="truncate text-sm text-muted">{c.intro_message || "No intro message"} · sent {formatDate(c.created_at)}</p>
              </div>
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.status === "accepted" ? "bg-soft text-brand" : c.status === "pending" ? "bg-soft text-warn" : c.status === "removed" ? "bg-soft text-muted" : "bg-soft text-danger"}`}>{c.status}</span>
              {c.status === "pending" && <ActionButton variant="outline" label="Cancel" pendingLabel="Cancelling…" action={cancelConnectionRequest.bind(null, c.id)} confirmText="Cancel this request?" />}
              {(c.status === "accepted" || c.status === "removed") && <Link href={`/student/messages?c=${c.id}`} className={c.status === "accepted" ? "btn btn-sm" : "btn btn-outline btn-sm"}>{c.status === "accepted" ? "Message" : "View chat"}</Link>}
              {c.status === "accepted" && <ActionButton variant="outline" label="Remove" pendingLabel="Removing…" confirmText="Remove this connection? Chat history stays readable but new messages are blocked." action={removeConnectionAction.bind(null, c.id)} />}
            </div>
          );
        })}
      </div>
    </>
  );
}