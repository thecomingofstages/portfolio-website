import { notFound } from "next/navigation";
import { connection } from "next/server";
import BlockRenderer from "@/components/BlockRenderer";
import Hero from "@/components/blocks/Hero";
import { getHomePage } from "@/lib/api";

/**
 * Home (task 1.14): the `home` page's blocks, in order, through BlockRenderer.
 * Data blocks arrive filled in. Blocks whose component has not landed yet
 * (sprints 2 and 3, and any still missing from sprint 1) render nothing.
 *
 * A Hero as the first block is the home banner (Hero `home`): the TCOS logo, `subtitle` and
 * `buttons`, centred. The editor keeps it first.
 *
 * Rendered per request, not at build time: builds have no API_URL, and every
 * visit shows the latest data (docs/FRONTEND.md "Keeping pages fresh").
 */
export default async function Home() {
  await connection();
  const page = await getHomePage();
  if (!page) notFound();

  const [first, ...rest] = page.blocks;
  const banner = first?.type === "hero" ? first : null;

  return (
    <div className="flex flex-col gap-12">
      {banner ? (
        <section id={banner.id} className="scroll-mt-20">
          <Hero block={banner} home />
        </section>
      ) : null}
      <BlockRenderer blocks={banner ? rest : page.blocks} />
    </div>
  );
}
