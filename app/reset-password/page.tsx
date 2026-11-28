import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "@/components/forms";
import { PublicTop } from "@/components/Shell";

export default async function ResetPasswordPage() {
  const client = await createClient();

  const {
    data: { user },
  } = await client.auth.getUser();

  return (
    <>
      <PublicTop />

      <main className="mx-auto max-w-md px-5 py-10">
        {user ? (
          <ResetPasswordForm />
        ) : (
          <section className="card">
            <h1 className="text-xl font-bold">
              Request a new reset link
            </h1>

            <p className="my-3">
              Open the link from your latest reset email in the
              browser where you requested it.
            </p>

            <Link
              href="/forgot-password"
              className="btn"
            >
              Request another link
            </Link>
          </section>
        )}
      </main>
    </>
  );
}