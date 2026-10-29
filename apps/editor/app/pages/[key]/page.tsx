import { notFound } from "next/navigation";
import BlocksEditor from "@/components/BlocksEditor";
import PageFieldsForm from "@/components/PageFieldsForm";
import {
  BackTitle,
  HeaderSlot,
  SaveButtons,
  SaveGroup,
} from "@/components/SaveGroup";
import { ShownMark, SiteLink } from "@/components/ui";
import { getPage, listProjects } from "@/lib/admin-api";
import { isAlwaysShown } from "@/lib/blocks";
import { canvasUrl } from "@/lib/canvas";
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
  const target = { kind: "page", key: page.key } as const;

  return (
    <SaveGroup>
      <HeaderSlot id="header-title">
        <BackTitle title={page.key === "home" ? "Home page" : page.title} />
      </HeaderSlot>
      <HeaderSlot id="header-actions">
        <SaveButtons />
      </HeaderSlot>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h1>{page.title}</h1>
          <p className="flex flex-wrap gap-x-5 gap-y-1">
            {isAlwaysShown(page.key) ? null : <ShownMark shown={page.is_shown} />}
            {page.updated_at ? (
              <span className="text-muted">
                Last saved {formatDate(page.updated_at)}
              </span>
            ) : null}
            {path && page.is_shown ? <SiteLink path={path} /> : null}
          </p>
        </div>
        <BlocksEditor
          target={target}
          initialBlocks={page.blocks}
          projectSlugs={projects.map((p) => p.slug)}
          canvasUrl={path ? canvasUrl(process.env.SITE_URL, target) : null}
          settings={
            <section
              aria-labelledby="page-heading"
              className="flex flex-col gap-4"
            >
              <h2 id="page-heading">Page</h2>
              <PageFieldsForm page={page} />
            </section>
          }
        />
      </div>
    </SaveGroup>
  );
}
