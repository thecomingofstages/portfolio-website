import { notFound } from "next/navigation";
import { connection } from "next/server";
import BlockRenderer from "@/components/BlockRenderer";
import { getHomePage } from "@/lib/api";

/**
 * Home (task 1.14): the `home` page's blocks, in order, through BlockRenderer.
 * Data blocks arrive filled in. Blocks whose component has not landed yet
 * (sprints 2 and 3, and any still missing from sprint 1) render nothing.
 *
 * Rendered per request, not at build time: builds have no API_URL, and every
 * visit shows the latest data (docs/FRONTEND.md "Keeping pages fresh").
 */
export default async function Home() {
  await connection();
  const page = await getHomePage();
  if (!page) notFound();

  return (
    <div className="flex flex-col gap-12">
      <BlockRenderer blocks={page.blocks} />
    </div>
  );
}
