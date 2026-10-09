"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, children, badge }: { href: string; children: React.ReactNode; badge?: number }) {
  const path = usePathname();
  const active = path === href || path.startsWith(href + "/");
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full px-3 py-1.5 text-sm transition ${
        active ? "bg-soft font-semibold text-brand" : "text-muted hover:bg-soft hover:text-brand"
      }`}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="ml-1 rounded-full bg-danger px-1.5 text-xs text-white">{badge}</span>
      )}
    </Link>
  );
}