import { notFound } from "next/navigation";
import { saveRound } from "@/app/actions";
import { DocEditor } from "@/components/DocEditor";
import { BackTitle, HeaderSlot, SaveButtons, SaveGroup } from "@/components/SaveGroup";
import { ShownMark, SiteLink } from "@/components/ui";
import { getRound, listProjects, listTracks } from "@/lib/admin-api";
import { formatDate } from "@/lib/dates";
import { formValue, ROUND_FIELDS } from "@/lib/forms";

// Live admin data on every visit: navigations wait for it (docs/EDITOR.md).
export const instant = false;

export default async function EditRound({ params }: PageProps<"/apply/[id]">) {
  const { id } = await params;
  // Round ids are database ids; anything else is not a round.
  const [round, projects, tracks] = /^[0-9a-f]{24}$/i.test(id)
    ? await Promise.all([getRound(id), listProjects(), listTracks()])
    : [null, [], []];
  if (!round) notFound();
  const when = formatDate(round.opens_at, round.extended_to ?? round.closes_at);

  return (
    <SaveGroup>
      <HeaderSlot id="header-title">
        <BackTitle title={round.title} />
      </HeaderSlot>
      <HeaderSlot id="header-actions">
        <SaveButtons />
      </HeaderSlot>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h1>{round.title}</h1>
          <p className="flex flex-wrap gap-x-5 gap-y-1">
            <span className="text-muted">รอบรับสมัคร</span>
            {when ? <span>{when}</span> : null}
            <ShownMark shown={round.is_shown} />
            {round.is_shown ? <SiteLink path="/join" /> : null}
          </p>
        </div>
        <DocEditor
          key={round._id}
          form="round"
          initial={formValue(round, ROUND_FIELDS)}
          save={saveRound.bind(null, round._id)}
          uploadTo={{ collection: "apply", owner: round._id.toLowerCase() }}
          projectSlugs={projects.map((p) => p.slug)}
          trackKeys={tracks.map((t) => t.key)}
        />
      </div>
    </SaveGroup>
  );
}
