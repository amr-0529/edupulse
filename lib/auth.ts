import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { type Profile, type Role } from "@/lib/types";

import { cache } from "react";

export const requireProfile = cache(async (): Promise<Profile> => {
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

  return profile as Profile;
});

export async function requireRole(role: Role): Promise<Profile> {
  const profile = await requireProfile();

  if (profile.role !== role) redirect("/403");

  return profile;
}