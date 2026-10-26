import { notFound } from "next/navigation";
import BlocksEditor from "@/components/BlocksEditor";
import ProjectForm from "@/components/ProjectForm";
import {
  BackTitle,
  HeaderSlot,
  SaveButtons,
  SaveGroup,
} from "@/components/SaveGroup";
import { ShownMark, SiteLink } from "@/components/ui";
import { getProject, listProjects } from "@/lib/admin-api";
import { canvasUrl } from "@/lib/canvas";
import { formatDate } from "@/lib/dates";

// Live admin data on every visit: navigations wait for it (docs/EDITOR.md).
export const instant = false;

export default async function EditProject({
  params,
}: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const [project, projects] = await Promise.all([
    getProject(slug),
    listProjects(),
  ]);
  if (!project) notFound();

  const count = (list?: { is_shown: boolean }[]) =>
    `${list?.length ?? 0} รายการ (แสดงอยู่ ${list?.filter((item) => item.is_shown).length ?? 0})`;
  const when = formatDate(project.start_date, project.end_date);
  const target = { kind: "project", slug: project.slug } as const;

  return (
    <SaveGroup>
      <HeaderSlot id="header-title">
        <BackTitle title={project.name} />
      </HeaderSlot>
      <HeaderSlot id="header-actions">
        <SaveButtons />
      </HeaderSlot>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h1>{project.name}</h1>
          <p className="flex flex-wrap gap-x-5 gap-y-1">
            {when ? <span>{when}</span> : null}
            {project.venue ? (
              <span className="text-muted">{project.venue}</span>
            ) : null}
            <ShownMark shown={project.is_shown} />
            {project.is_shown ? (
              <SiteLink
                path={`/projects/${encodeURIComponent(project.slug)}`}
              />
            ) : null}
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
              <section
                aria-labelledby="project-heading"
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col">
                  <h2 id="project-heading">Project</h2>
                  <p className="text-muted">
                    ส่วนหัวของหน้าโปรเจกต์: ชื่อ วันที่ สถานที่ และรูปแรก
                  </p>
                </div>
                <ProjectForm key={project.slug} project={project} />
              </section>
              <section
                aria-labelledby="lists-heading"
                className="flex flex-col gap-1 border-l-2 border-border pl-4"
              >
                <h3 id="lists-heading">Team, sponsors and highlights</h3>
                <p className="text-muted">
                  ยังแก้ที่นี่ไม่ได้ ทีม {count(project.team)} สปอนเซอร์{" "}
                  {count(project.sponsors)} ไฮไลต์ {count(project.highlights)}{" "}
                  รายการเหล่านี้เกี่ยวกับการยินยอมเรื่องรูปและโลโก้ ตอนนี้จึงต้องแก้ผ่าน admin API (ดู docs/EDITOR.md)
                </p>
              </section>
            </div>
          }
        />
      </div>
    </SaveGroup>
  );
}
