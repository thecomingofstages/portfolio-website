/** Public recruitment rounds (task S3): GET /api/join, and the join block in S4. */
import type { ApplyDoc, Models } from "../models";
import { shownProjectNames } from "./project.helper";
import { publicPositions, publicTimeline } from "./visibility.helper";

const DAY_MS = 86_400_000;

/**
 * Rounds open at `now`, closing soonest first (DATABASE.md "Pages and their queries").
 * A round closes at extended_to when it is set, else at closes_at.
 * `projectSlug` limits the list to one project's rounds (the join block on a project page).
 */
export async function listOpenRounds(m: Models, now: Date, projectSlug?: string) {
  const rounds = await m.apply
    .aggregate<ApplyDoc>([
      { $match: { is_shown: true, opens_at: { $lte: now }, ...(projectSlug ? { project_slug: projectSlug } : {}) } },
      { $addFields: { closes_on: { $ifNull: ["$extended_to", "$closes_at"] } } },
      // A date without a time is midnight UTC: the round stays open through that day.
      { $addFields: { closes_on: { $add: ["$closes_on", { $cond: [{ $eq: [{ $mod: [{ $toLong: "$closes_on" }, DAY_MS] }, 0] }, DAY_MS, 0] }] } } },
      { $match: { closes_on: { $gte: now } } },
      { $sort: { closes_on: 1, _id: 1 } },
      { $project: { closes_on: 0 } },
    ])
    .toArray();

  const slugs = rounds.flatMap((r) => (r.project_slug ? [r.project_slug] : []));
  const names = await shownProjectNames(m, slugs);

  return rounds.map((r) => ({
    title: r.title,
    poster: r.poster ?? null,
    opens_at: r.opens_at,
    closes_at: r.closes_at,
    extended_to: r.extended_to ?? null,
    qualifications: r.qualifications
      ? {
          age_min: r.qualifications.age_min ?? null,
          age_max: r.qualifications.age_max ?? null,
          age_note: r.qualifications.age_note ?? null,
          items: [...(r.qualifications.items ?? [])],
        }
      : null,
    positions: publicPositions(r.positions),
    timeline: publicTimeline(r.timeline),
    apply_url: r.apply_url ?? null,
    // TODO(round of a hidden project): the docs do not say; the name of a hidden project is not sent.
    project_name: r.project_slug ? (names.get(r.project_slug) ?? null) : null,
  }));
}
