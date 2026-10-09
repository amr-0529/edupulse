"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema, fieldErrorsFrom } from "@/lib/validation";
import { HOME_BY_ROLE, type ActionState, type Role } from "@/lib/types";

export async function signUpAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };
  const { fullName, email, password, role } = parsed.data;

  const supabase = await createClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
      emailRedirectTo: `${site}/auth/callback`,
    },
  });

  if (error) {
    if (/already registered/i.test(error.message))
      return { ok: false, fieldErrors: { email: "This email is already registered." } };
    return { ok: false, error: "We could not create your account. Please try again." };
  }
  if (data.user && data.user.identities?.length === 0) {
    return { ok: false, fieldErrors: { email: "This email is already registered." } };
  }
  if (data.session) redirect(HOME_BY_ROLE[role as Role]);
  return {
    ok: true,
    message: "Account created. Check your email and click the verification link, then log in.",
  };
}

export async function signInAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    if (error && /not confirmed/i.test(error.message)) {
      return {
        ok: false,
        error: "Please verify your email first. Check your inbox for the verification link.",
      };
    }
    return { ok: false, error: "Invalid email or password." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", data.user.id)
    .single();

  if (!profile) {
    await supabase.auth.signOut();
    return {
      ok: false,
      error: "Your account profile could not be loaded. Please contact an administrator.",
    };
  }
  if (!profile.is_active) {
    await supabase.auth.signOut();
    return { ok: false, error: "This account has been deactivated." };
  }
  redirect(HOME_BY_ROLE[profile.role as Role]);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}