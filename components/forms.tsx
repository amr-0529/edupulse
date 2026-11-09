"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signInAction, signUpAction, resendVerificationAction, requestPasswordResetAction, updatePasswordAction } from "@/app/actions/auth";
import { addSlotAction } from "@/app/actions/availability";
import { FieldError, FormMessage, SubmitButton } from "@/components/ui";
import { initialState } from "@/lib/types";
import { emailSchema, newPasswordSchema, formErrors } from "@/lib/validation";
import { useClientValidation } from "@/components/useClientValidation";

function PasswordInput({
  id,
  name,
  autoComplete,
  describedBy,
  invalid,
}: {
  id: string;
  name: string;
  autoComplete: string;
  describedBy?: string;
  invalid?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 pr-14 outline-none focus:border-emerald-600"
        required
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-2 my-auto h-8 rounded-full px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
      >
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}

export function LoginForm({ notice }: { notice?: { text: string; tone: "ok" | "bad" } }) {
  const [state, action, isPending] = useActionState(signInAction, initialState);
  return (
    <>
    <form action={action} className="rounded-2xl border border-emerald-100 bg-white p-6" noValidate>
      <h1 className="text-2xl font-extrabold">Welcome back</h1>
      {notice && (
        <p className={`mt-2 text-sm font-semibold ${notice.tone === "ok" ? "text-emerald-700" : "text-red-600"}`} role="status">
          {notice.text}
        </p>
      )}
      <label className="mt-4 mb-1 block text-sm font-semibold" htmlFor="email">Email</label>
      <input id="email" name="email" type="email" autoComplete="email" className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-emerald-600" required aria-describedby="email-error" aria-invalid={!!state.fieldErrors?.email} />
      <FieldError state={state} name="email" />
      <label className="mt-3 mb-1 block text-sm font-semibold" htmlFor="password">Password</label>
      <PasswordInput id="password" name="password" autoComplete="current-password" describedBy="password-error" invalid={!!state.fieldErrors?.password} />
      <FieldError state={state} name="password" />
      <FormMessage state={state} />
      <SubmitButton className="mt-4 w-full" pending="Signing in…" isPending={isPending}>Log in</SubmitButton>
      <p className="mt-3 text-center text-sm"><Link href="/forgot-password" className="text-emerald-700 underline">Forgot your password?</Link></p>
      <p className="mt-3 text-center text-sm text-zinc-600">New here? <Link href="/register" className="text-emerald-700 underline">Create an account</Link></p>
    </form>
    {state.error && state.error.includes("verify your email") && <ResendVerification />}
    </>
  );
}

export function RegisterForm({ initialRole = "student" }: { initialRole?: "student" | "mentor" }) {
  const [state, action, isPending] = useActionState(signUpAction, initialState);

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-white p-6">
        <h1 className="text-2xl font-extrabold">Almost there</h1>
        <p className="mt-3 text-emerald-700" role="status">{state.message}</p>
        <Link href="/login" className="mt-4 inline-block rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white">Go to log in</Link>
      </div>
    );
  }

  return (
    <form action={action} className="rounded-2xl border border-emerald-100 bg-white p-6" noValidate>
      <h1 className="text-2xl font-extrabold">Create your account</h1>
      <label className="mt-4 mb-1 block text-sm font-semibold" htmlFor="fullName">Full name</label>
      <input id="fullName" name="fullName" maxLength={60} className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-emerald-600" autoComplete="name" required />
      <FieldError state={state} name="fullName" />
      <label className="mt-3 mb-1 block text-sm font-semibold" htmlFor="email">Email</label>
      <input id="email" name="email" type="email" autoComplete="email" className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-emerald-600" required />
      <FieldError state={state} name="email" />
      <label className="mt-3 mb-1 block text-sm font-semibold" htmlFor="role">I am a</label>
      <select id="role" name="role" className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-emerald-600" defaultValue={initialRole}>
        <option value="student">Student</option>
        <option value="mentor">Mentor (reviewed by an administrator before listing)</option>
      </select>
      <FieldError state={state} name="role" />
      <label className="mt-3 mb-1 block text-sm font-semibold" htmlFor="password">Password (8+ characters, letter and number)</label>
      <PasswordInput id="password" name="password" autoComplete="new-password" describedBy="password-error" invalid={!!state.fieldErrors?.password} />
      <FieldError state={state} name="password" />
      <FormMessage state={state} />
      <SubmitButton className="mt-4 w-full" pending="Creating account…" isPending={isPending}>Create account</SubmitButton>
      <p className="mt-3 text-center text-sm text-zinc-600">Already registered? <Link href="/login" className="text-emerald-700 underline">Log in</Link></p>
    </form>
  );
}

export function AddSlotForm() {
  const [state, action, isPending] = useActionState(addSlotAction, initialState);
  return (
    <form action={action} className="rounded-2xl border border-emerald-100 bg-white p-6" noValidate>
      <h2 className="text-lg font-bold">Publish a time slot (Sri Lanka time)</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div><label className="mb-1 block text-sm font-semibold" htmlFor="date">Date</label><input id="date" name="date" type="date" className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-emerald-600" required /></div>
        <div><label className="mb-1 block text-sm font-semibold" htmlFor="start">Start</label><input id="start" name="start" type="time" className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-emerald-600" required /></div>
        <div><label className="mb-1 block text-sm font-semibold" htmlFor="end">End</label><input id="end" name="end" type="time" className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-emerald-600" required /></div>
      </div>
      <p className="mt-2 text-xs text-zinc-500">Slots must be in the future, 15–120 minutes long, and must not overlap.</p>
      <FormMessage state={state} />
      <SubmitButton className="mt-3" pending="Publishing…" isPending={isPending}>Add slot</SubmitButton>
    </form>
  );
}

export function ResendVerification() {
  const [state, action, isPending] = useActionState(resendVerificationAction, initialState);
  return (
    <form action={action} className="rounded-2xl border border-emerald-100 bg-white p-6 mt-4" noValidate>
      <p className="text-sm font-semibold">Did not get the verification email?</p>
      <div className="mt-2 flex flex-wrap items-start gap-2">
        <input name="email" type="email" required placeholder="you@example.com" aria-label="Email to resend verification to" className="w-full max-w-xs rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-emerald-600" />
        <SubmitButton className="btn-outline btn-sm" pending="Sending…" isPending={isPending}>Resend email</SubmitButton>
      </div>
      <FieldError state={state} name="email" />
      <FormMessage state={state} />
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, isPending] = useActionState(requestPasswordResetAction, initialState);
  return (
    <form action={action} className="rounded-2xl border border-emerald-100 bg-white p-6" noValidate>
      <h1 className="text-2xl font-extrabold">Reset your password</h1>
      <p className="mt-2 text-sm text-zinc-600">Enter your account email and we will send you a reset link.</p>
      <label className="mt-4 mb-1 block text-sm font-semibold" htmlFor="email">Email</label>
      <input id="email" name="email" type="email" autoComplete="email" className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-emerald-600" required />
      <FieldError state={state} name="email" />
      <FormMessage state={state} />
      <SubmitButton className="mt-4 w-full" pending="Sending…" isPending={isPending}>Send reset link</SubmitButton>
      <p className="mt-3 text-center text-sm text-zinc-600"><Link href="/login" className="text-emerald-700 underline">Back to log in</Link></p>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action, isPending] = useActionState(updatePasswordAction, initialState);
  return (
    <form action={action} className="rounded-2xl border border-emerald-100 bg-white p-6" noValidate>
      <h1 className="text-2xl font-extrabold">Choose a new password</h1>
      <label className="mt-4 mb-1 block text-sm font-semibold" htmlFor="password">New password (8+ characters, letter and number)</label>
      <PasswordInput id="password" name="password" autoComplete="new-password" describedBy="password-error" invalid={!!state.fieldErrors?.password} />
      <FieldError state={state} name="password" />
      <label className="mt-3 mb-1 block text-sm font-semibold" htmlFor="confirm">Confirm new password</label>
      <PasswordInput id="confirm" name="confirm" autoComplete="new-password" describedBy="confirm-error" invalid={!!state.fieldErrors?.confirm} />
      <FieldError state={state} name="confirm" />
      <FormMessage state={state} />
      <SubmitButton className="mt-4 w-full" pending="Saving…" isPending={isPending}>Update password</SubmitButton>
    </form>
  );
}