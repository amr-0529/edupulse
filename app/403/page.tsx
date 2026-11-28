import Link from "next/link";

export default function Forbidden() {
  return (
    <main className="mx-auto max-w-md px-5 py-20 text-center">
      <h1 className="text-3xl font-extrabold">
        403 – No permission
      </h1>

      <p className="mt-3 text-muted">
        Your account role does not allow access to this page.
      </p>

      <Link
        href="/"
        className="btn btn-outline mt-6"
      >
        ← Back to home
      </Link>
    </main>
  );
}