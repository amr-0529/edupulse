import { Shell } from "@/components/Shell";
import { requireRole } from "@/lib/auth";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole("student");
  return (
    <Shell role="student" name={profile.full_name}>
      {children}
    </Shell>
  );
}