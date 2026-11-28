import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forms";
import { PublicTop } from "@/components/Shell";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    sent?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <>
      <PublicTop />

      <main className="mx-auto max-w-md px-5 py-10">
        {params.sent === "1" ? (
          <section className="card">
            <h1 className="text-2xl font-bold">
              Check your inbox
            </h1>

            <p className="my-3">
              If this email belongs to an account, you will receive
              a password reset link. Check your spam folder too.
            </p>

            <Link
              className="btn btn-outline"
              href="/forgot-password"
            >
              Request another link
            </Link>

            <p className="mt-3">
              <Link
                className="text-brand underline"
                href="/login"
              >
                Back to log in
              </Link>
            </p>
          </section>
        ) : (
          <>
            {params.error === "expired" && (
              <p
                role="alert"
                className="field-error mb-3"
              >
                This link has expired or was already used.
                Request a new link below.
              </p>
            )}

            <ForgotPasswordForm />
          </>
        )}
      </main>
    </>
  );
}