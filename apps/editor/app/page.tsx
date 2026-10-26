import Link from "next/link";
import { ShownMark } from "@/components/ui";
import { listPages, listProjects } from "@/lib/admin-api";
import { formatDate } from "@/lib/dates";

// Live admin data on every visit: navigations wait for it (docs/EDITOR.md).
export const instant = false;

const rowClass =
  "flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-[var(--radius-card)] px-3 py-3 hover:bg-card-bg";

/** The editor's start: every page and project, hidden ones too. */
export default async function Dashboard() {
  const [pages, projects] = await Promise.all([listPages(), listProjects()]);
  // Newest first; an undecided date ("<...>") goes last.
  const time = (date: string) => Date.parse(date) || 0;
  const byNewest = [...projects].sort((a, b) => time(b.start_date) - time(a.start_date));

  return (
    <div className="flex max-w-4xl flex-col gap-12">
      <h1 className="sr-only">Pages and projects</h1>
      {process.env.USE_FIXTURES === "true" ? (
        <p className="border-l-2 border-accent pl-3 text-muted">
          Sample data: changes last until the editor restarts, and nothing reaches the real site.
        </p>
      ) : null}
      <section aria-labelledby="pages-heading" className="flex flex-col gap-2">
        <h2 id="pages-heading" className="text-h1 font-extrabold">
          Pages
        </h2>
        <ul className="flex flex-col">
          {pages.map((page) => (
            <li key={page.key}>
              <Link href={`/pages/${encodeURIComponent(page.key)}`} className={rowClass}>
                <span className="font-heading text-body-lg font-semibold">{page.title}</span>
                <span className="text-muted">{page.blocks.length} blocks</span>
                <span className="ml-auto">
                  <ShownMark shown={page.is_shown} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="projects-heading" className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="projects-heading" className="text-h1 font-extrabold">
            Projects
          </h2>
          <Link href="/projects/new" className="btn btn-primary">
            New project
          </Link>
        </div>
        {byNewest.length === 0 ? (
          <p className="text-muted">No projects yet. Create the first one.</p>
        ) : (
          <ul className="flex flex-col">
            {byNewest.map((project) => (
              <li key={project.slug}>
                <Link href={`/projects/${encodeURIComponent(project.slug)}`} className={rowClass}>
                  <span className="font-heading text-body-lg font-semibold">{project.name}</span>
                  <span className="text-muted">{formatDate(project.start_date, project.end_date) || "No date yet"}</span>
                  <span className="ml-auto">
                    <ShownMark shown={project.is_shown} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
