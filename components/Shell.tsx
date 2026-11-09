import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import { NavLink } from "@/components/NavLink";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Role } from "@/lib/types";

const NAV: Record<Role, [string, string][]> = {
  student: [
    ["/student/dashboard", "Dashboard"],
    ["/student/discover", "Find mentors"],
    ["/student/connections", "Connections"],
    ["/student/messages", "Messages"],
    ["/student/sessions", "Sessions"],
    ["/student/profile", "Profile"],
  ],
  mentor: [
    ["/mentor/dashboard", "Dashboard"],
    ["/mentor/requests", "Requests"],
    ["/mentor/availability", "Availability"],
    ["/mentor/messages", "Messages"],
    ["/mentor/sessions", "Sessions"],
    ["/mentor/profile", "Profile"],
  ],
  admin: [
    ["/admin/dashboard", "Overview"],
    ["/admin/approvals", "Mentor approvals"],
    ["/admin/users", "Users"],
    ["/admin/reports", "Reports"],
    ["/admin/categories", "Categories"],
  ],
};

const CONTAINER = "mx-auto w-full max-w-5xl px-5 md:max-w-6xl md:px-8 lg:max-w-7xl lg:px-10";

export function Shell({
  role,
  name,
  unread = 0,
  children,
}: {
  role: Role;
  name: string;
  unread?: number;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-line bg-card/95 backdrop-blur">
        <div className={`${CONTAINER} flex flex-wrap items-center justify-between gap-3 py-3 md:py-4`}>
          <div className="flex items-center gap-2">
            <Link href={NAV[role][0][0]} className="text-xl font-extrabold text-brand md:text-2xl">
              EduPulse
            </Link>
            <span className="rounded-full bg-soft px-2.5 py-0.5 text-xs font-semibold text-brand">{role}</span>
          </div>
          <nav aria-label="Main" className="order-3 flex w-full flex-wrap items-center gap-1 md:order-none md:w-auto">
            {NAV[role].map(([href, label]) => (
              <NavLink key={href} href={href} badge={label === "Messages" ? unread : undefined}>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/help" className="hidden text-sm text-muted underline sm:inline">Help</Link>
            <span className="hidden text-sm text-muted sm:inline">{name}</span>
            <ThemeToggle />
            <form action={signOutAction}>
              <button className="btn btn-outline btn-sm" type="submit">
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className={`${CONTAINER} py-6 md:py-8 lg:py-10`}>{children}</main>
    </>
  );
}

export function PublicTop() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-card/95 backdrop-blur">
      <div className={`${CONTAINER} flex items-center justify-between py-3 md:py-4`}>
        <Link href="/" className="text-xl font-extrabold text-brand md:text-2xl">
          EduPulse
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/help" className="hidden text-sm text-muted underline sm:inline">Help</Link>
          <ThemeToggle />
          <Link href="/login" className="btn btn-outline btn-sm">
            Log in
          </Link>
          <Link href="/register" className="btn btn-sm">
            Join EduPulse
          </Link>
        </div>
      </div>
    </header>
  );
}

export function Avatar({ name, path, size = 44 }: { name: string; path?: string | null; size?: number }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const url = path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}` : null;
  if (url) {
    return <img src={url} alt="" width={size} height={size} className="flex-none rounded-full border border-line object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <div aria-hidden className="grid h-11 w-11 flex-none place-items-center rounded-full border border-line bg-soft text-lg font-bold text-brand" style={{ width: size, height: size }}>
      {initial}
    </div>
  );
}

export function Badge({ children, tone = "ok" }: { children: React.ReactNode; tone?: "ok" | "warn" | "bad" | "muted" }) {
  const t = { ok: "bg-soft text-brand", warn: "bg-soft text-warn", bad: "bg-soft text-danger", muted: "bg-soft text-muted" }[tone];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${t}`}>{children}</span>;
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="card text-center">
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-2 text-sm text-muted">{children}</div>}
    </div>
  );
}