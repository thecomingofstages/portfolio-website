"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV_LINKS = [
  { href: "/projects", label: "Projects" },
  { href: "/tracks", label: "Tracks" },
  { href: "/join", label: "Join" },
] as const;

export function isCurrent(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Nav() {
  const pathname = usePathname() ?? "/";

  return (
    <header className="border-b border-border">
      <nav
        aria-label="Main"
        className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6"
      >
        {/* TODO(logo): the project lead adds the enrollment site's logo file to public/; show it here. */}
        <Link
          href="/"
          aria-current={pathname === "/" ? "page" : undefined}
          className="rounded-nav px-2 py-1 font-heading text-xl font-extrabold text-foreground focus-visible:outline-2 focus-visible:outline-gold"
        >
          TCOS
        </Link>
        <ul className="flex flex-wrap items-center gap-1 sm:gap-2">
          {NAV_LINKS.map(({ href, label }) => {
            const current = isCurrent(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={current ? "page" : undefined}
                  className={`block rounded-nav px-3 py-2 underline-offset-8 transition-colors focus-visible:outline-2 focus-visible:outline-gold ${
                    current
                      ? "text-gold underline decoration-2"
                      : "text-nav-inactive hover:text-gold-hover"
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
