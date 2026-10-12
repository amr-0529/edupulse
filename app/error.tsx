"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 py-20 text-center">
      <p className="font-bold text-brand">ERROR</p>
      <h1 className="mt-2 text-3xl font-extrabold">Something went wrong</h1>
      <p className="mt-3 text-muted">
        The page could not be loaded. Please try again. If the problem continues, log out and back in.
      </p>
      <button onClick={reset} className="btn mt-6">
        Try again
      </button>
    </main>
  );
}