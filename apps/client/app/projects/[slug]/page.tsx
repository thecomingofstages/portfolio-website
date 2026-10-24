import { notFound } from "next/navigation";
import BlockRenderer from "@/components/BlockRenderer";
import ProjectHeader from "@/components/ProjectHeader";
import { getProject } from "@/lib/api";

/**
 * A project page can hold a `join` block, so it also refreshes once a day for
 * rounds that open or close (docs/FRONTEND.md "Keeping pages fresh").
 */
export const revalidate = 86400;

/**
 * Project page (task 1.16): the fixed ProjectHeader, then the project's blocks
 * in order through BlockRenderer. A missing or hidden slug is a 404.
 */
export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  return (
    <div className="flex flex-col gap-12">
      <ProjectHeader project={project} />
      <BlockRenderer blocks={project.blocks} />
    </div>
  );
}
