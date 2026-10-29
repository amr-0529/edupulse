import { Shell } from "@/components/Shell";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getUnreadCount } from "@/lib/queries";

export default async function MentorLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole("mentor");
  const supabase = await createClient();
  const unread = await getUnreadCount(supabase, profile.id);
  
  return (
    <Shell role="mentor" name={profile.full_name} unread={unread}>
      {children}
    </Shell>
  );
}