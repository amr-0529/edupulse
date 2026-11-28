"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  registerSchema,
  fieldErrorsFrom,
  emailSchema,
  newPasswordSchema,
} from "@/lib/validation";
import {
  HOME_BY_ROLE,
  type ActionState,
  type Role,
} from "@/lib/types";

export async function signUpAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const values = {
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    role: String(formData.get("role") ?? ""),
  };

  const parsed = registerSchema.safeParse({
    ...values,
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: fieldErrorsFrom(parsed.error),
      values,
    };
  }

  const { fullName, email, password, role } = parsed.data;
  const supabase = await createClient();
  const site =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
      },
      emailRedirectTo: `${site}/auth/callback`,
    },
  });

  if (error) {
    console.error("[edupulse] Signup failed", {
      code: error.code,
      status: error.status,
    });

    if (/already registered/i.test(error.message)) {
      return {
        ok: false,
        fieldErrors: {
          email: "This email is already registered.",
        },
        values,
      };
    }

    return {
      ok: false,
      error: "We could not create your account. Please try again.",
      values,
    };
  }

  if (data.user && data.user.identities?.length === 0) {
    return {
      ok: false,
      fieldErrors: {
        email: "This email is already registered.",
      },
      values,
    };
  }

  if (data.session) {
    redirect(HOME_BY_ROLE[role as Role]);
  }

  return {
    ok: true,
    message:
      "Account created. Check your email and click the verification link, then log in.",
  };
}

export async function signInAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const values = {
    email: String(formData.get("email") ?? ""),
  };

  const parsed = loginSchema.safeParse({
    email: values.email,
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: fieldErrorsFrom(parsed.error),
      values,
    };
  }

  const supabase = await createClient();

  const { data, error } =
    await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    if (error && /not confirmed/i.test(error.message)) {
      return {
        ok: false,
        error:
          "Please verify your email first. Check your inbox for the verification link.",
        values,
      };
    }

    return {
      ok: false,
      error: "Invalid email or password.",
      values,
    };
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
      error:
        "Your account profile could not be loaded. Please contact an administrator.",
      values,
    };
  }

  if (!profile.is_active) {
    await supabase.auth.signOut();

    return {
      ok: false,
      error: "This account has been deactivated.",
      values,
    };
  }

  redirect(HOME_BY_ROLE[profile.role as Role]);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function resendVerificationAction(
  _p: ActionState,
  fd: FormData
): Promise<ActionState> {
  const values = {
    email: String(fd.get("email") ?? ""),
  };

  const email = emailSchema.safeParse(values.email ?? "");

  if (!email.success) {
    return {
      ok: false,
      fieldErrors: {
        email: email.error.issues[0].message,
      },
      values,
    };
  }

  const supabase = await createClient();
  const site =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email.data,
    options: {
      emailRedirectTo: `${site}/auth/callback`,
    },
  });

  if (error) {
    console.error("[edupulse] Email request failed", error.status);

    return {
      ok: false,
      error: "Email could not be sent. Please try again shortly.",
      values,
    };
  }

  return {
    ok: true,
    message:
      "If that address has an unverified account, a new verification email has been sent.",
  };
}

export async function requestPasswordResetAction(
  _p: ActionState,
  fd: FormData
): Promise<ActionState> {
  const values = {
    email: String(fd.get("email") ?? ""),
  };

  const email = emailSchema.safeParse(values.email ?? "");

  if (!email.success) {
    return {
      ok: false,
      fieldErrors: {
        email: email.error.issues[0].message,
      },
      values,
    };
  }

  const supabase = await createClient();
  const site =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(
    email.data,
    {
      redirectTo: `${site}/auth/callback?next=/reset-password`,
    }
  );

  if (error) {
    console.error("[edupulse] Email request failed", error.status);

    return {
      ok: false,
      error: "Email could not be sent. Please try again shortly.",
      values,
    };
  }

  redirect("/forgot-password?sent=1");
}

export async function updatePasswordAction(
  _p: ActionState,
  fd: FormData
): Promise<ActionState> {
  const parsed = newPasswordSchema.safeParse({
    password: fd.get("password") ?? "",
    confirm: fd.get("confirm") ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      error:
        "This reset link has expired or was already used. Please request a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    console.error("[PASSWORD UPDATE ERROR]", error.message);

    return {
      ok: false,
      error:
        "We could not update your password. Please request a new reset link.",
    };
  }

  await supabase.auth.signOut();
  redirect("/reset-password/complete");
}