import { DocList } from "@/components/DocList";
import { listProjects } from "@/lib/admin-api";
import { formatDate } from "@/lib/dates";

// Live admin data on every visit: navigations wait for it (docs/EDITOR.md).
export const instant = false;

/** Every project, hidden ones too, newest first. */
export default async function Projects() {
  const projects = await listProjects();
  // An undecided date ("<...>") goes last.
  const time = (date: string) => Date.parse(date) || 0;
  const byNewest = [...projects].sort((a, b) => time(b.start_date) - time(a.start_date));
  return (
    <DocList
      title="Projects"
      create={{ href: "/new/project", label: "New project" }}
      empty="ยังไม่มีโปรเจกต์ สร้างโปรเจกต์แรกได้เลย"
      rows={byNewest.map((p) => ({
        href: `/projects/${encodeURIComponent(p.slug)}`,
        name: p.name,
        detail: formatDate(p.start_date, p.end_date) || "No date yet",
        shown: p.is_shown,
      }))}
    />
  );
}
