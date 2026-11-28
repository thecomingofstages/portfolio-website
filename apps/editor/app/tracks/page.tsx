import { DocList } from "@/components/DocList";
import { listTracks } from "@/lib/admin-api";

// Live admin data on every visit: navigations wait for it (docs/EDITOR.md).
export const instant = false;

/** Every track, hidden ones too. */
export default async function Tracks() {
  const tracks = await listTracks();
  return (
    <DocList
      title="Tracks"
      create={{ href: "/new/track", label: "New track" }}
      empty="ยังไม่มีสายงาน สร้างสายงานแรกได้เลย"
      rows={tracks.map((t) => ({
        href: `/tracks/${encodeURIComponent(t.key)}`,
        name: t.display_name,
        detail: t.key,
        shown: t.is_shown,
      }))}
    />
  );
}
