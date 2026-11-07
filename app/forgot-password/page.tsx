import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forms";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto max-w-md px-5 py-10">
      <Link href="/" className="text-sm text-emerald-700 underline">← Back to home</Link>
      <div className="mt-4">
        <ForgotPasswordForm />
      </div>
    </main>
  );
}