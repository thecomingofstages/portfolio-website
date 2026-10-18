/** Public track (สายงาน) data (task S3): the /tracks list and the track popup. */
import type { Models } from "../models";
import { shownProjectNames } from "./project.helper";
import { publicAchievements } from "./visibility.helper";

/** GET /api/tracks: shown tracks by `order`. */
export async function listTracks(m: Models) {
  const docs = await m.tracks
    .find({ is_shown: true }, { projection: { key: 1, display_name: 1, desc: 1 } })
    .sort({ order: 1, key: 1 })
    .toArray();
  return docs.map((t) => ({ key: t.key, display_name: t.display_name, desc: t.desc ?? null }));
}

/**
 * GET /api/tracks/:key: the popup. Each achievement names its project as text;
 * an achievement whose project is hidden or missing is left out.
 */
export async function getTrack(m: Models, key: string) {
  const t = await m.tracks.findOne({ key, is_shown: true });
  if (!t) return null;

  const achievements = publicAchievements(t.achievements);
  const names = await shownProjectNames(m, achievements.map((a) => a.project_slug));

  return {
    key: t.key,
    display_name: t.display_name,
    desc: t.desc ?? null,
    pics: [...(t.pics ?? [])],
    achievements: achievements.flatMap(({ project_slug, ...a }) => {
      const project_name = names.get(project_slug);
      return project_name === undefined ? [] : [{ ...a, project_name }];
    }),
  };
}
