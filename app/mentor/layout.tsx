import { Shell } from "@/components/Shell";
import { requireRole } from "@/lib/auth";

export default async function MentorLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole("mentor");
  return (
    <Shell role="mentor" name={profile.full_name}>
      {children}
    </Shell>
  );
}