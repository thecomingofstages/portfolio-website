import Shelf from "@/components/Shelf";
import type { BlockProps } from ".";

/**
 * The `projects` block on the Home page (docs/DATABASE.md "projects" block, task 1.12).
 *
 * Renders the same bookshelf component as /projects, but with:
 * - filter=off (showFilter=false)
 * - toggle=off (showToggle=false)
 * - "See all" link ON (showSeeAll=true)
 *
 * It uses the projects array filled in by the server (or fixture),
 * already limited and filtered for visibility.
 */
export default function ProjectsBlock({ block }: BlockProps<"projects">) {
  const { title, projects } = block;

  return (
    <Shelf
      projects={projects ?? []}
      title={title}
      showFilter={false}
      showToggle={false}
      showSeeAll={true}
    />
  );
}
