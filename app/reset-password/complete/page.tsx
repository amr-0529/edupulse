import Link from "next/link";
import { PublicTop } from "@/components/Shell";

export default function PasswordResetComplete() {
  return (
    <>
      <PublicTop />

      <main className="mx-auto max-w-md px-5 py-10">
        <section className="card">
          <h1 className="text-2xl font-bold">
            Password reset complete
          </h1>

          <p className="my-3">
            Log in with your new password to continue to EduPulse.
          </p>

          <Link
            className="btn"
            href="/login"
          >
            Back to log in
          </Link>
        </section>
      </main>
    </>
  );
}