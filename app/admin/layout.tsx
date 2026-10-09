import { Shell } from "@/components/Shell";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole("admin");
  return (
    <Shell role="admin" name={profile.full_name}>
      {children}
    </Shell>
  );
}