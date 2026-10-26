import Link from "next/link";
import type { ReactNode } from "react";
import { ShownMark } from "@/components/ui";
import { listPages, listProjects, listRounds, listTracks } from "@/lib/admin-api";
import { formatDate } from "@/lib/dates";

// Live admin data on every visit: navigations wait for it (docs/EDITOR.md).
export const instant = false;

type Row = { href: string; name: string; detail?: string; shown: boolean };

/** One kind of document: its heading, a create button, and one row per document, hidden ones too. */
function Section({ id, title, create, empty, rows }: { id: string; title: string; create?: ReactNode; empty: string; rows: Row[] }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={id} className="text-h1 font-extrabold">
          {title}
        </h2>
        {create}
      </div>
      {rows.length === 0 ? (
        <p className="text-muted">{empty}</p>
      ) : (
        <ul className="flex flex-col">
          {rows.map((row) => (
            <li key={row.href}>
              <Link
                href={row.href}
                className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-[var(--radius-card)] px-3 py-3 hover:bg-card-bg"
              >
                <span className="font-heading text-body-lg font-semibold">{row.name}</span>
                {row.detail ? <span className="text-muted">{row.detail}</span> : null}
                <span className="ml-auto">
                  <ShownMark shown={row.shown} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const createLink = (href: string, label: string) => (
  <Link href={href} className="btn btn-primary">
    {label}
  </Link>
);

/** The editor's start: every page, project, track and recruitment round, hidden ones too. */
export default async function Dashboard() {
  const [pages, projects, tracks, rounds] = await Promise.all([listPages(), listProjects(), listTracks(), listRounds()]);
  // Newest first; an undecided date ("<...>") goes last.
  const time = (date: string) => Date.parse(date) || 0;
  const byNewest = [...projects].sort((a, b) => time(b.start_date) - time(a.start_date));

  return (
    <div className="flex flex-col gap-12">
      <h1 className="sr-only">Pages, projects, tracks and recruitment rounds</h1>
      <Section
        id="pages-heading"
        title="Pages"
        empty="ยังไม่มีหน้า"
        rows={pages.map((p) => ({
          href: `/pages/${encodeURIComponent(p.key)}`,
          name: p.title,
          detail: `${p.blocks.length} blocks`,
          shown: p.is_shown,
        }))}
      />
      <Section
        id="projects-heading"
        title="Projects"
        create={createLink("/new/project", "New project")}
        empty="ยังไม่มีโปรเจกต์ สร้างโปรเจกต์แรกได้เลย"
        rows={byNewest.map((p) => ({
          href: `/projects/${encodeURIComponent(p.slug)}`,
          name: p.name,
          detail: formatDate(p.start_date, p.end_date) || "No date yet",
          shown: p.is_shown,
        }))}
      />
      <Section
        id="rounds-heading"
        title="Recruitment rounds"
        create={createLink("/new/round", "New round")}
        empty="ยังไม่มีรอบรับสมัคร สร้างรอบแรกได้เลย"
        rows={rounds.map((r) => ({
          href: `/apply/${encodeURIComponent(r._id)}`,
          name: r.title,
          detail: formatDate(r.opens_at, r.extended_to ?? r.closes_at) || "No date yet",
          shown: r.is_shown,
        }))}
      />
      <Section
        id="tracks-heading"
        title="Tracks"
        create={createLink("/new/track", "New track")}
        empty="ยังไม่มีสายงาน สร้างสายงานแรกได้เลย"
        rows={tracks.map((t) => ({
          href: `/tracks/${encodeURIComponent(t.key)}`,
          name: t.display_name,
          detail: t.key,
          shown: t.is_shown,
        }))}
      />
    </div>
  );
}
