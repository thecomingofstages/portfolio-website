"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/pages/home", label: "Home page", current: (path: string) => path.startsWith("/pages/") },
  { href: "/", label: "Projects", current: (path: string) => path === "/" || path.startsWith("/projects") },
];

/** The editor's nav. The current link is gold, as on the public site. */
export default function NavLinks() {
  const path = usePathname();
  return (
    <nav aria-label="Editor" className="flex gap-5">
      {LINKS.map(({ href, label, current }) => {
        const active = current(path);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={active ? "text-accent" : "text-muted hover:text-foreground"}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
