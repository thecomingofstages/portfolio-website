import Link from "next/link";
import { notFound } from "next/navigation";
import BlocksEditor from "@/components/BlocksEditor";
import ProjectForm from "@/components/ProjectForm";
import { ShownBadge, SiteLink } from "@/components/ui";
import { getProject, listProjects } from "@/lib/admin-api";

// Live admin data on every visit: navigations wait for it (docs/EDITOR.md).
export const instant = false;

export default async function EditProject({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const [project, projects] = await Promise.all([getProject(slug), listProjects()]);
  if (!project) notFound();

  const count = (list?: { is_shown: boolean }[]) =>
    `${list?.length ?? 0} (${list?.filter((item) => item.is_shown).length ?? 0} shown)`;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link href="/" className="text-muted hover:text-foreground">
          ← All pages and projects
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1>{project.name}</h1>
          <ShownBadge shown={project.is_shown} />
          {project.is_shown ? <SiteLink path={`/projects/${encodeURIComponent(project.slug)}`} /> : null}
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2>Project</h2>
        <p className="text-muted">
          The header of the project page: name, dates, venue and the first picture. Blocks follow below it.
        </p>
        <ProjectForm key={project.slug} project={project} />
      </section>

      <section className="flex flex-col gap-1 rounded-[var(--radius-card)] border border-border p-4">
        <h3>Not edited here yet</h3>
        <p className="text-muted">
          Team {count(project.team)} · Sponsors {count(project.sponsors)} · Highlights {count(project.highlights)}.
          These lists carry consent flags, so they wait for the server&apos;s photo check (task S7). See docs/EDITOR.md.
        </p>
      </section>

      <BlocksEditor
        key={project.slug}
        target={{ kind: "project", slug: project.slug }}
        initialBlocks={project.blocks ?? []}
        projectSlugs={projects.map((p) => p.slug)}
      />
    </div>
  );
}
