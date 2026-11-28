import { DocList } from "@/components/DocList";
import { listRounds } from "@/lib/admin-api";
import { formatDate } from "@/lib/dates";

// Live admin data on every visit: navigations wait for it (docs/EDITOR.md).
export const instant = false;

/** Every recruitment round, hidden ones too. */
export default async function Rounds() {
  const rounds = await listRounds();
  return (
    <DocList
      title="Recruitment rounds"
      create={{ href: "/new/round", label: "New round" }}
      empty="ยังไม่มีรอบรับสมัคร สร้างรอบแรกได้เลย"
      rows={rounds.map((r) => ({
        href: `/apply/${encodeURIComponent(r._id)}`,
        name: r.title,
        detail: formatDate(r.opens_at, r.extended_to ?? r.closes_at) || "No date yet",
        shown: r.is_shown,
      }))}
    />
  );
}
