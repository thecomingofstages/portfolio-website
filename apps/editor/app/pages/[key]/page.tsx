import Link from "next/link";
import { notFound } from "next/navigation";
import BlocksEditor from "@/components/BlocksEditor";
import PageFieldsForm from "@/components/PageFieldsForm";
import SitePreview from "@/components/SitePreview";
import { ShownMark } from "@/components/ui";
import { getPage, listProjects } from "@/lib/admin-api";
import { formatDate } from "@/lib/dates";

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
    <div className={path ? "grid gap-12 lg:grid-cols-[minmax(0,1fr)_24rem]" : "max-w-4xl"}>
      <div className="flex min-w-0 flex-col gap-12">
        <div className="flex flex-col gap-3">
          <Link href="/" className="text-muted hover:text-foreground">
            All pages and projects
          </Link>
          <h1>{page.title}</h1>
          <p className="flex flex-wrap gap-x-5 gap-y-1">
            <ShownMark shown={page.is_shown} />
            {page.updated_at ? <span className="text-muted">Last saved {formatDate(page.updated_at)}</span> : null}
          </p>
        </div>
        <PageFieldsForm page={page} />
        <BlocksEditor
          target={{ kind: "page", key: page.key }}
          initialBlocks={page.blocks}
          projectSlugs={projects.map((p) => p.slug)}
        />
      </div>
      {path ? <SitePreview path={path} shown={page.is_shown} data={page} /> : null}
    </div>
  );
}
