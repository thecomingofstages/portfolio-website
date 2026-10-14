/** `tracks` collection (สายงาน), as in tcos_schema.mongodb.js. */
import type { ObjectId } from "mongodb";

export const TRACKS = "tracks";

export type AchievementItem = {
  _id: ObjectId;
  project_slug: string;
  year?: number | null;
  text: string;
  pics?: string[];
  is_shown: boolean;
};

export type TrackDoc = {
  _id?: ObjectId;
  key: string;
  display_name: string;
  desc?: string;
  pics?: string[];
  achievements?: AchievementItem[];
  order?: number;
  is_shown: boolean;
};
