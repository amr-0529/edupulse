export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="skeleton h-6 w-40" />
      <div className="skeleton h-9 w-64" />
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="skeleton h-48" />
        <div className="skeleton h-48" />
      </div>
    </div>
  );
}