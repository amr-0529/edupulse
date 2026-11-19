import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ChatClient, type Msg } from "@/components/ChatClient";
import { Avatar } from "@/components/Shell";
import { one } from "@/lib/queries";
import type { Role } from "@/lib/types";

type Conn = {
  id: string;
  status: "accepted" | "removed";
  student_id: string;
  mentor_id: string;
  student: { full_name: string; avatar_path: string | null } | { full_name: string; avatar_path: string | null }[] | null;
  mentor: { full_name: string; avatar_path: string | null } | { full_name: string; avatar_path: string | null }[] | null;
};

export async function MessagesView({ role, meId, selected }: { role: Role; meId: string; selected?: string }) {
  const supabase = await createClient();
  const base = role === "student" ? "/student" : "/mentor";

  const { data, error } = await supabase
    .from("connections")
    .select("id, status, student_id, mentor_id, student:profiles!connections_student_id_fkey(full_name, avatar_path), mentor:profiles!connections_mentor_id_fkey(full_name, avatar_path)")
    .in("status", ["accepted", "removed"]);

  if (error) {
    return <div className="card text-center"><p className="font-semibold">Messages could not be loaded.</p><p className="mt-2 text-sm text-muted">Please refresh the page to retry.</p></div>;
  }

  const convs = ((data ?? []) as unknown as Conn[]).map((c) => {
    const other = role === "student" ? one(c.mentor) : one(c.student);
    return {
      id: c.id,
      readOnly: c.status === "removed",
      otherId: role === "student" ? c.mentor_id : c.student_id,
      otherName: other?.full_name ?? "Unknown user",
      otherAvatar: other?.avatar_path ?? null,
    };
  });

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
  const hasMore = (history ?? []).length === 50;

  return (
    <div className="grid gap-4 md:grid-cols-[18rem_1fr]">
      <aside aria-label="Conversations" className="card space-y-1 p-2">
        {convs.map((c) => (
          <Link
            key={c.id}
            href={`${base}/messages?c=${c.id}`}
            className={`flex items-center gap-3 rounded-xl p-2 transition hover:bg-soft ${c.id === active.id ? "bg-soft" : ""}`}
          >
            <Avatar name={c.otherName} path={c.otherAvatar} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{c.otherName}</p>
              <p className="truncate text-xs text-muted">{c.readOnly ? "Connection ended · read-only" : "Active"}</p>
            </div>
          </Link>
        ))}
      </aside>
      <ChatClient key={active.id} connectionId={active.id} meId={meId} otherName={active.otherName} otherId={active.otherId} otherAvatar={active.otherAvatar} readOnly={active.readOnly} hasMore={hasMore} initial={initial} />
    </div>
  );
}