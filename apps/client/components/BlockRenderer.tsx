import type { ComponentType } from "react";
import type { Block } from "@/types/api";
import { blockComponents, type BlockComponents } from "./blocks";

/**
 * Renders a page's blocks in order, each in a section whose id is the block's
 * `id` (its #anchor). Unknown types, and types whose component does not exist
 * yet, render nothing; the rest of the page still renders.
 */
export default function BlockRenderer({
  blocks,
  components = blockComponents,
}: {
  blocks: readonly Block[];
  /** For tests; pages use the default registry. */
  components?: BlockComponents;
}) {
  return (
    <>
      {blocks.map((block, index) => {
        const Component = Object.hasOwn(components, block.type)
          ? (components[block.type] as ComponentType<{ block: Block }> | undefined)
          : undefined;
        if (!Component) return null;
        return (
          <section key={`${block.id}-${index}`} id={block.id} className="scroll-mt-20">
            <Component block={block} />
          </section>
        );
      })}
    </>
  );
}
