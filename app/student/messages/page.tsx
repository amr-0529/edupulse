import { requireRole } from "@/lib/auth";
import { MessagesView } from "@/components/MessagesView";

export default async function StudentMessages({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const me = await requireRole("student");
  const sp = await searchParams;
  
  return (
    <>
      <h1 className="mb-4 text-3xl font-extrabold">Messages</h1>
      <MessagesView role="student" meId={me.id} selected={sp.c} />
    </>
  );
}