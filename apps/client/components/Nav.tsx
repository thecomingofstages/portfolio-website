"use client";

import Image from "next/image";
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
        className="page-width flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3"
      >
        <Link
          href="/"
          aria-current={pathname === "/" ? "page" : undefined}
          className="block rounded-nav p-1 focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Image src="/logo.png" alt="The Coming of Stages" width={412} height={359} priority className="h-10 w-auto" />
        </Link>
        <ul className="flex flex-wrap items-center gap-1 sm:gap-2">
          {NAV_LINKS.map(({ href, label }) => {
            const current = isCurrent(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={current ? "page" : undefined}
                  className={`block rounded-nav px-3 py-2 underline-offset-8 transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                    current
                      ? "font-bold text-accent underline decoration-2"
                      : "text-muted hover:text-accent-hover"
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
