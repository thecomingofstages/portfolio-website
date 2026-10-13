/**
 * One typed handle per collection. No ORM: the database's $jsonSchema validators
 * enforce the schema (docs/API.md "Database access"); these are types only.
 *
 * References are by string key, not ObjectId:
 *   tracks.key ◄── projects.team[].dept_key, apply.positions[].dept_key
 *   projects.slug ◄── tracks.achievements[].project_slug, apply.project_slug
 */
import type { Collection, Db } from "mongodb";
import { APPLY, type ApplyDoc } from "./apply.model";
import { PAGES, type PageDoc } from "./page.model";
import { PROJECTS, type ProjectDoc } from "./project.model";
import { TRACKS, type TrackDoc } from "./track.model";

export type Models = {
  db: Db;
  projects: Collection<ProjectDoc>;
  tracks: Collection<TrackDoc>;
  apply: Collection<ApplyDoc>;
  pages: Collection<PageDoc>;
};

export function initModels(db: Db): Models {
  return {
    db,
    projects: db.collection<ProjectDoc>(PROJECTS),
    tracks: db.collection<TrackDoc>(TRACKS),
    apply: db.collection<ApplyDoc>(APPLY),
    pages: db.collection<PageDoc>(PAGES),
  };
}

export type * from "./apply.model";
export type * from "./block.model";
export type * from "./page.model";
export type * from "./project.model";
export type * from "./track.model";
