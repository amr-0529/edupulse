import Link from "next/link";
import { LoginForm } from "@/components/forms";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; verified?: string }>;
}) {
  const sp = await searchParams;
  let notice: { text: string; tone: "ok" | "bad" } | undefined;
  if (sp.verified) notice = { text: "Email verified. You can log in now.", tone: "ok" };
  else if (sp.error === "deactivated")
    notice = { text: "This account has been deactivated.", tone: "bad" };
  else if (sp.error === "verification")
    notice = {
      text: "The verification link is invalid or expired. Please register again.",
      tone: "bad",
    };
  else if (sp.error === "noprofile")
    notice = { text: "Your account profile could not be loaded.", tone: "bad" };

  return (
    <main className="mx-auto max-w-md px-5 py-10">
      <Link href="/" className="text-sm text-emerald-700 underline">
        ← Back to home
      </Link>
      <div className="mt-4">
        <LoginForm notice={notice} />
      </div>
    </main>
  );
}