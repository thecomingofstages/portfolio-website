/** `projects` collection, as in tcos_schema.mongodb.js. Optional schema fields are optional here. */
import type { ObjectId } from "mongodb";
import type { Block } from "./block.model";

export const PROJECTS = "projects";

export type TeamMember = {
  _id: ObjectId;
  name: string;
  nickname?: string;
  dept_key: string;
  dept_name?: string;
  position: string;
  /** Only stored while is_photo_allowed is true. */
  photo?: string;
  is_photo_allowed?: boolean;
  is_shown: boolean;
};

export type SponsorItem = {
  _id: ObjectId;
  name: string;
  logo?: string | null;
  logo_permission?: boolean;
  tier?: string | null;
  is_shown: boolean;
};

export type HighlightItem = {
  _id: ObjectId;
  event_name: string;
  date?: Date | null;
  venue?: string | null;
  desc?: string;
  pics?: string[];
  is_shown: boolean;
};

export type ProjectDoc = {
  _id?: ObjectId;
  slug: string;
  name: string;
  type: "stage_play" | "mini_concert" | "camp" | "club" | "workshop" | "event" | "central_team";
  status: "upcoming" | "recruiting" | "in_progress" | "completed" | "cancelled";
  start_date: Date;
  end_date?: Date | null;
  venue?: string | null;
  summary?: string;
  org_chart_image?: string | null;
  pics?: string[];
  team?: TeamMember[];
  sponsors?: SponsorItem[];
  highlights?: HighlightItem[];
  blocks?: Block[];
  is_yearbook_shown?: boolean;
  is_shown: boolean;
};
