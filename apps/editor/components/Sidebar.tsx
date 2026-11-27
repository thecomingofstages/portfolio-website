"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// The home list's sections (app/page.tsx ids); `paths` are the editor routes that belong to each.
export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", paths: [] },
  { href: "/#pages-heading", label: "Pages", paths: ["/pages"] },
  { href: "/#projects-heading", label: "Projects", paths: ["/projects", "/new/project"] },
  { href: "/#rounds-heading", label: "Recruitment rounds", paths: ["/apply", "/new/round"] },
  { href: "/#tracks-heading", label: "Tracks", paths: ["/tracks", "/new/track"] },
] as const;

export function isActivePath(pathname: string, item: (typeof NAV_ITEMS)[number]): boolean {
  if (item.href === "/") return pathname === "/";
  return item.paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="Portfolio website editor, all pages and projects">
      <Image src="/logo.png" alt="The Coming of Stages" width={412} height={359} priority className="h-9 w-auto" />
      <span className="font-heading font-semibold">Portfolio website editor</span>
    </Link>
  );
}

/**
 * Scrolls to the section a sidebar link names (/#projects-heading), once the home list has rendered.
 * Coming from another page, Next tries the hash while app/loading.tsx is still showing, so it lands at the top.
 */
export function ScrollToHash() {
  useEffect(() => {
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }, []);
  return null;
}

/** The editor's nav, as on the merch dashboard: a left column from md up, a Menu toggle on phones. */
export function Sidebar() {
  const pathname = usePathname();
  const [openOnPath, setOpenOnPath] = useState<string | null>(null);
  const mobileOpen = openOnPath === pathname;

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenOnPath(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <aside className="border-b border-border md:w-60 md:shrink-0 md:border-r md:border-b-0">
      <div className="flex items-center justify-between gap-3 px-4 py-3 md:hidden">
        <Brand />
        <button
          type="button"
          className="btn"
          aria-expanded={mobileOpen}
          aria-controls="editor-nav"
          onClick={() => setOpenOnPath((prev) => (prev === pathname ? null : pathname))}
        >
          Menu
        </button>
      </div>

      <nav
        id="editor-nav"
        aria-label="Editor"
        className={`${mobileOpen ? "flex" : "hidden"} flex-col gap-2 border-t border-border p-4 md:sticky md:top-0 md:flex md:h-screen md:border-t-0`}
      >
        <div className="hidden px-2 pt-2 pb-4 md:block">
          <Brand />
        </div>
        <ul className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpenOnPath(null)}
                  className={`flex min-h-10 items-center rounded-nav px-3 font-heading transition-colors duration-150 ${
                    active ? "bg-card-bg font-semibold text-accent" : "text-muted hover:bg-card-bg hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
