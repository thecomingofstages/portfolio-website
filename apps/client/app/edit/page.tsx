import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import EditCanvas from "@/components/edit/EditCanvas";
import ProjectHeader from "@/components/ProjectHeader";
import { getHomePage, getProject } from "@/lib/api";
import { originsOf } from "@/components/edit/draft";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Edit mode (docs/FRONTEND.md "Edit mode"): the page the editor frames, at `/edit?page=home` or
 * `/edit?project=<slug>`. It shows the editor's unsaved blocks with the site's own components.
 * Off unless EDITOR_ORIGIN is set; the blocks come only from its origins, by message.
 *
 * Data blocks need the server's data, so it reads the page as last saved from the public API:
 * shown blocks only, as on the site. It never asks for hidden data.
 */
export default async function EditPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const editorOrigins = originsOf(process.env.EDITOR_ORIGIN);
  if (editorOrigins.length === 0) notFound();

  const { page, project: slug } = await searchParams;
  if (typeof slug === "string") {
    const project = await getProject(slug);
    return (
      <EditCanvas
        editorOrigins={editorOrigins}
        saved={project?.blocks ?? []}
        header={project ? <ProjectHeader project={project} /> : undefined}
      />
    );
  }
  if (page === "home") {
    const home = await getHomePage();
    return <EditCanvas editorOrigins={editorOrigins} saved={home?.blocks ?? []} home />;
  }
  notFound();
}
