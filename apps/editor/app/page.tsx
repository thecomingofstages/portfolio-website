import Link from "next/link";
import { ShownBadge } from "@/components/ui";
import { listPages, listProjects } from "@/lib/admin-api";

// Live admin data on every visit: navigations wait for it (docs/EDITOR.md).
export const instant = false;

/** The editor's start: every page and project, hidden ones too. */
export default async function Dashboard() {
  const [pages, projects] = await Promise.all([listPages(), listProjects()]);
  const byNewest = [...projects].sort((a, b) => b.start_date.localeCompare(a.start_date));

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3">
        <h1>Pages</h1>
        <ul className="flex flex-col divide-y divide-border rounded-[var(--radius-card)] border border-border">
          {pages.map((page) => (
            <li key={page.key}>
              <Link
                href={`/pages/${encodeURIComponent(page.key)}`}
                className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-card-bg"
              >
                <span className="font-heading font-semibold">{page.title}</span>
                <span className="text-muted">{page.key}</span>
                <span className="text-muted">{page.blocks.length} blocks</span>
                <span className="ml-auto">
                  <ShownBadge shown={page.is_shown} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1>Projects</h1>
          <Link href="/projects/new" className="btn btn-primary ml-auto">
            New project
          </Link>
        </div>
        {byNewest.length === 0 ? (
          <p className="text-muted">No projects yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-[var(--radius-card)] border border-border">
            {byNewest.map((project) => (
              <li key={project.slug}>
                <Link
                  href={`/projects/${encodeURIComponent(project.slug)}`}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-card-bg"
                >
                  <span className="font-heading font-semibold">{project.name}</span>
                  <span className="text-muted">{project.slug}</span>
                  <span className="text-muted">{project.start_date.slice(0, 10)}</span>
                  <span className="ml-auto">
                    <ShownBadge shown={project.is_shown} />
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
