import Link from "next/link";
import { notFound } from "next/navigation";
import BlocksEditor from "@/components/BlocksEditor";
import PageFieldsForm from "@/components/PageFieldsForm";
import { ShownBadge, SiteLink } from "@/components/ui";
import { getPage, listProjects } from "@/lib/admin-api";

/** Public path of a page by its key: `home` is `/`. Other pages have no path yet. */
const sitePath = (key: string) => (key === "home" ? "/" : null);

// Live admin data on every visit: navigations wait for it (docs/EDITOR.md).
export const instant = false;

export default async function EditPage({ params }: PageProps<"/pages/[key]">) {
  const { key } = await params;
  const [page, projects] = await Promise.all([getPage(key), listProjects()]);
  if (!page) notFound();
  const path = sitePath(page.key);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link href="/" className="text-muted hover:text-foreground">
          ← All pages and projects
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1>{page.title}</h1>
          <ShownBadge shown={page.is_shown} />
          {path ? <SiteLink path={path} /> : null}
        </div>
        <p className="text-muted">
          Page key: {page.key}
          {page.updated_at ? ` · Last saved ${page.updated_at.slice(0, 16).replace("T", " ")} UTC` : ""}
        </p>
      </div>
      <PageFieldsForm page={page} />
      <BlocksEditor
        target={{ kind: "page", key: page.key }}
        initialBlocks={page.blocks}
        projectSlugs={projects.map((p) => p.slug)}
      />
    </div>
  );
}
