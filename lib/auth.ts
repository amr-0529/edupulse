import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HOME_BY_ROLE, type Profile, type Role } from "@/lib/types";

/**
 * Defence in depth: middleware already redirects, and every role layout calls this again.
 * RLS is the final barrier.
 */
export async function requireRole(role: Role): Promise<Profile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, is_active")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login?error=noprofile");
  if (!profile.is_active) redirect("/auth/deactivated");
  if (profile.role !== role) redirect(HOME_BY_ROLE[profile.role as Role]);
  return profile as Profile;
}