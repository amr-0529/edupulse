import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 py-20 text-center">
      <p className="font-bold text-brand">404</p>
      <h1 className="mt-2 text-3xl font-extrabold">Page not found</h1>
      <p className="mt-3 text-muted">
        We could not find what you were looking for. The page may have moved, or the link may be broken.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn">
          Back to home
        </Link>
      </div>
    </main>
  );
}