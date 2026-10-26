import { notFound } from "next/navigation";
import { saveTrack } from "@/app/actions";
import { DocEditor } from "@/components/DocEditor";
import { BackTitle, HeaderSlot, SaveButtons, SaveGroup } from "@/components/SaveGroup";
import { ShownMark, SiteLink } from "@/components/ui";
import { getTrack, listProjects, listTracks } from "@/lib/admin-api";
import { formValue, TRACK_FIELDS } from "@/lib/forms";

// Live admin data on every visit: navigations wait for it (docs/EDITOR.md).
export const instant = false;

export default async function EditTrack({ params }: PageProps<"/tracks/[key]">) {
  const { key } = await params;
  const [track, projects, tracks] = await Promise.all([getTrack(key), listProjects(), listTracks()]);
  if (!track) notFound();

  return (
    <SaveGroup>
      <HeaderSlot id="header-title">
        <BackTitle title={track.display_name} />
      </HeaderSlot>
      <HeaderSlot id="header-actions">
        <SaveButtons />
      </HeaderSlot>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h1>{track.display_name}</h1>
          <p className="flex flex-wrap gap-x-5 gap-y-1">
            <span className="text-muted">สายงาน</span>
            <ShownMark shown={track.is_shown} />
            {track.is_shown ? <SiteLink path={`/tracks/${encodeURIComponent(track.key)}`} /> : null}
          </p>
        </div>
        <DocEditor
          key={track.key}
          form="track"
          initial={formValue(track, TRACK_FIELDS)}
          save={saveTrack.bind(null, track.key)}
          uploadTo={{ collection: "tracks", owner: track.key }}
          projectSlugs={projects.map((p) => p.slug)}
          trackKeys={tracks.map((t) => t.key)}
        />
      </div>
    </SaveGroup>
  );
}
