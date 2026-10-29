import { notFound } from "next/navigation";
import { saveTrack } from "@/app/actions";
import { DocEditor } from "@/components/DocEditor";
import { BackTitle, HeaderSlot, SaveButtons, SaveGroup } from "@/components/SaveGroup";
import { SiteLink } from "@/components/ui";
import { getTrack, listProjects } from "@/lib/admin-api";
import { formValue, TRACK_FIELDS } from "@/lib/forms";

// Live admin data on every visit: navigations wait for it (docs/EDITOR.md).
export const instant = false;

export default async function EditTrack({ params }: PageProps<"/tracks/[key]">) {
  const { key } = await params;
  const [track, projects] = await Promise.all([getTrack(key), listProjects()]);
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
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <span className="text-muted">สายงาน</span>
            <span id="title-shown" className="contents" />
            {track.is_shown ? <SiteLink path={`/tracks/${encodeURIComponent(track.key)}`} /> : null}
          </div>
        </div>
        <DocEditor
          key={track.key}
          form="track"
          initial={formValue(track, TRACK_FIELDS)}
          save={saveTrack.bind(null, track.key)}
          uploadTo={{ collection: "tracks", owner: track.key }}
          projectSlugs={projects.map((p) => p.slug)}
        />
      </div>
    </SaveGroup>
  );
}
