import Link from "next/link";
import { RegisterForm } from "@/components/forms";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const sp = await searchParams;
  const initialRole = sp.role === "mentor" ? "mentor" : "student";
  return (
    <main className="mx-auto max-w-md px-5 py-10">
      <Link href="/" className="text-sm text-emerald-700 underline">
        ← Back to home
      </Link>
      <div className="mt-4">
        <RegisterForm initialRole={initialRole} />
      </div>
    </main>
  );
}