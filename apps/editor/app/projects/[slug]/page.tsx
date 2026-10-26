import Link from "next/link";
import { notFound } from "next/navigation";
import BlocksEditor from "@/components/BlocksEditor";
import ProjectForm from "@/components/ProjectForm";
import { ShownMark, SiteLink } from "@/components/ui";
import { getProject, listProjects } from "@/lib/admin-api";
import { canvasUrl } from "@/lib/canvas";
import { formatDate } from "@/lib/dates";

// Live admin data on every visit: navigations wait for it (docs/EDITOR.md).
export const instant = false;

export default async function EditProject({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const [project, projects] = await Promise.all([getProject(slug), listProjects()]);
  if (!project) notFound();

  const count = (list?: { is_shown: boolean }[]) =>
    `${list?.length ?? 0}, ${list?.filter((item) => item.is_shown).length ?? 0} shown`;
  const when = formatDate(project.start_date, project.end_date);
  const target = { kind: "project", slug: project.slug } as const;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link href="/" className="text-muted hover:text-foreground">
          All pages and projects
        </Link>
        <h1>{project.name}</h1>
        <p className="flex flex-wrap gap-x-5 gap-y-1">
          {when ? <span>{when}</span> : null}
          {project.venue ? <span className="text-muted">{project.venue}</span> : null}
          <ShownMark shown={project.is_shown} />
          {project.is_shown ? <SiteLink path={`/projects/${encodeURIComponent(project.slug)}`} /> : null}
        </p>
      </div>

      <BlocksEditor
        key={project.slug}
        target={target}
        initialBlocks={project.blocks ?? []}
        projectSlugs={projects.map((p) => p.slug)}
        canvasUrl={canvasUrl(process.env.SITE_URL, target)}
        settings={
          <div className="flex flex-col gap-6">
            <section aria-labelledby="project-heading" className="flex flex-col gap-4">
              <div className="flex flex-col">
                <h2 id="project-heading">Project</h2>
                <p className="text-muted">The header of the project page: name, dates, venue and the first picture.</p>
              </div>
              <ProjectForm key={project.slug} project={project} />
            </section>
            <section aria-labelledby="lists-heading" className="flex flex-col gap-1 border-l-2 border-border pl-4">
              <h3 id="lists-heading">Team, sponsors and highlights</h3>
              <p className="text-muted">
                Not edited here yet. Team {count(project.team)}. Sponsors {count(project.sponsors)}. Highlights{" "}
                {count(project.highlights)}. They carry photo and logo consent, so for now they are changed through
                the admin API (docs/EDITOR.md).
              </p>
            </section>
          </div>
        }
      />
    </div>
  );
}
