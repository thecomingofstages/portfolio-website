/**
 * Public response pieces, as in docs/API.md "Response shapes" and
 * apps/client/types/api.ts. Dates stay `Date` here: res.json() sends them as ISO strings.
 *
 * No `_id`, `is_shown`, `is_photo_allowed` or `logo_permission` anywhere:
 * only shown things are sent, so the flags carry no information.
 */
export type PublicMember = {
  name: string;
  nickname: string | null;
  position: string;
  /** null unless the person allowed their photo. */
  photo: string | null;
};

export type PublicSponsor = {
  name: string;
  /** null unless the sponsor gave logo permission. */
  logo: string | null;
  tier: string | null;
};

export type PublicHighlight = {
  event_name: string;
  date: Date | null;
  venue: string | null;
  desc: string | null;
  pics: string[];
};

export type PublicAudition = {
  clip_required: boolean | null;
  clip_brief: string | null;
  clip_max_minutes: number | null;
  clip_file_name: string | null;
  clip_upload: string | null;
  pieces: string[];
  onsite: boolean | null;
};

export type PublicPosition = {
  dept_key: string;
  dept_name: string | null;
  unit_name: string | null;
  title: string;
  description: string | null;
  requirements: string[];
  portfolio_required: boolean | null;
  onsite_required: boolean | null;
  audition: PublicAudition | null;
};

export type PublicTimelineEvent = {
  start_date: Date;
  end_date: Date | null;
  event_name: string;
  event_description: string | null;
  location: string | null;
};

/** A track achievement before S3 adds `project_name` from its project. */
export type PublicAchievement = {
  project_slug: string;
  year: number | null;
  text: string;
  pics: string[];
};

/** A stored block without `is_shown`. S4 adds the data of data blocks. */
export type PublicBlock = {
  id: string;
  type: string;
  title: string | null;
  [field: string]: unknown;
};
