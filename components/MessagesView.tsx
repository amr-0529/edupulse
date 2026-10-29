import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ChatClient, type Msg } from "@/components/ChatClient";
import { one } from "@/lib/queries";
import type { Role } from "@/lib/types";

type Conn = {
  id: string;
  student: { full_name: string } | { full_name: string }[] | null;
  mentor: { full_name: string } | { full_name: string }[] | null;
};

export async function MessagesView({ role, meId, selected }: { role: Role; meId: string; selected?: string }) {
  const supabase = await createClient();
  const base = role === "student" ? "/student" : "/mentor";

  const { data, error } = await supabase
    .from("connections")
    .select("id, student:profiles!connections_student_id_fkey(full_name), mentor:profiles!connections_mentor_id_fkey(full_name)")
    .eq("status", "accepted");

  if (error) {
    return (
      <div className="card text-center">
        <p className="font-semibold">Messages could not be loaded.</p>
        <p className="mt-2 text-sm text-muted">Please refresh the page to retry.</p>
      </div>
    );
  }

  const convs = ((data ?? []) as unknown as Conn[]).map((c) => ({
    id: c.id,
    other: (role === "student" ? one(c.mentor)?.full_name : one(c.student)?.full_name) ?? "Unknown user",
  }));

  if (convs.length === 0) {
    return (
      <div className="card text-center">
        <p className="font-semibold">No conversations yet</p>
        <p className="mt-2 text-sm text-muted">
          {role === "student" ? (
            <>Once a mentor accepts your request you can chat here. <Link className="text-brand underline" href="/student/discover">Find a mentor</Link>.</>
          ) : (
            <>Accept a student's request to start a conversation.</>
          )}
        </p>
      </div>
    );
  }

  const active = convs.find((c) => c.id === selected) ?? convs[0];
  const { data: history } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("connection_id", active.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const initial = ((history ?? []) as Msg[]).slice().reverse();

  return (
    <div className="grid gap-4 md:grid-cols-[18rem_1fr]">
      <aside aria-label="Conversations" className="card space-y-1 p-2">
        {convs.map((c) => (
          <Link
            key={c.id}
            href={`${base}/messages?c=${c.id}`}
            className={`flex items-center gap-3 rounded-xl p-2 transition hover:bg-soft ${c.id === active.id ? "bg-soft" : ""}`}
          >
            <div aria-hidden className="grid h-11 w-11 flex-none place-items-center rounded-full border border-line bg-soft text-lg font-bold text-brand">
              {c.other.trim().charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{c.other}</p>
            </div>
          </Link>
        ))}
      </aside>
      <ChatClient key={active.id} connectionId={active.id} meId={meId} otherName={active.other} initial={initial} />
    </div>
  );
}