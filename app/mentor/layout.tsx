import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import { NavLink } from "@/components/NavLink";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RealtimeBadge } from "@/components/RealtimeBadge";
import type { Role } from "@/lib/types";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getUnreadCount } from "@/lib/queries";

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

function Shell({
  role,
  name,
  meId,
  unread = 0,
  children,
}: {
  role: Role;
  name: string;
  meId: string;
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
              <NavLink key={href} href={href}>
                {label}
                {label === "Messages" && <RealtimeBadge meId={meId} unread={unread} />}
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

export default async function MentorLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole("mentor");
  const unread = await getUnreadCount(await createClient(), profile.id);
  return (
    <Shell role="mentor" name={profile.full_name} meId={profile.id} unread={unread}>
      {children}
    </Shell>
  );
}