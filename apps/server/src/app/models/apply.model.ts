/** `apply` collection (recruitment rounds, display only), as in tcos_schema.mongodb.js. */
import type { ObjectId } from "mongodb";

export const APPLY = "apply";

export type Audition = {
  clip_required?: boolean;
  clip_brief?: string;
  clip_max_minutes?: number | null;
  clip_file_name?: string;
  clip_upload?: string;
  pieces?: string[];
  onsite?: boolean;
};

export type PositionItem = {
  _id: ObjectId;
  dept_key: string;
  dept_name?: string;
  unit_name?: string | null;
  title: string;
  description?: string;
  requirements?: string[];
  portfolio_required?: boolean;
  onsite_required?: boolean;
  audition?: Audition;
  is_shown: boolean;
};

export type TimelineItem = {
  _id: ObjectId;
  start_date: Date;
  end_date?: Date | null;
  event_name: string;
  event_description?: string;
  location?: string | null;
  is_shown: boolean;
};

export type ApplyDoc = {
  _id?: ObjectId;
  project_slug?: string | null;
  title: string;
  opens_at: Date;
  closes_at: Date;
  extended_to?: Date | null;
  qualifications?: {
    age_min?: number | null;
    age_max?: number | null;
    age_note?: string | null;
    items?: string[];
  };
  positions: PositionItem[];
  timeline?: TimelineItem[];
  apply_url?: string | null;
  poster?: string | null;
  is_shown: boolean;
};
