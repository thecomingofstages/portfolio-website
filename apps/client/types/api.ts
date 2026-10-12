/**
 * Public API response types. They follow docs/API.md "Response shapes";
 * change that section (with approval) before changing anything here.
 *
 * - Dates are ISO 8601 strings.
 * - An optional field the document does not have arrives as `null` (or `[]` for lists).
 * - `pics` on cards and page headers holds at most one URL (`pics[0]`).
 * - Hidden documents and items never arrive, so there are no `is_shown` flags here.
 */

export type IsoDate = string;
export type Url = string;

// ---------------------------------------------------------------------------
// Shared pieces

export type ProjectCard = {
  slug: string;
  name: string;
  start_date: IsoDate;
  /** At most one item: the project's pics[0]. */
  pics: Url[];
};

export type TrackCard = {
  key: string;
  display_name: string;
  desc: string | null;
  /** At most one item: the track's pics[0]. */
  pics: Url[];
};

export type YearbookCard = {
  slug: string;
  name: string;
  /** At most one item: the project's pics[0]. */
  pics: Url[];
};

export type Member = {
  name: string;
  nickname: string | null;
  position: string;
  /** `null` unless the person allowed their photo. */
  photo: Url | null;
};

/** A project's shown team, grouped by `dept_key`, sorted by `dept_name`. */
export type Department = {
  dept_key: string;
  dept_name: string | null;
  members: Member[];
};

export type Sponsor = {
  name: string;
  /** `null` unless the sponsor gave logo permission. */
  logo: Url | null;
  tier: string | null;
};

export type Highlight = {
  event_name: string;
  date: IsoDate | null;
  venue: string | null;
  desc: string | null;
  pics: Url[];
};

export type Qualifications = {
  age_min: number | null;
  age_max: number | null;
  age_note: string | null;
  items: string[];
};

export type Audition = {
  clip_required: boolean | null;
  clip_brief: string | null;
  clip_max_minutes: number | null;
  clip_file_name: string | null;
  clip_upload: string | null;
  pieces: string[];
  onsite: boolean | null;
};

export type Position = {
  dept_key: string;
  dept_name: string | null;
  unit_name: string | null;
  title: string;
  description: string | null;
  requirements: string[];
  portfolio_required: boolean | null;
  onsite_required: boolean | null;
  audition: Audition | null;
};

export type TimelineEvent = {
  start_date: IsoDate;
  end_date: IsoDate | null;
  event_name: string;
  event_description: string | null;
  /** `null` means online. */
  location: string | null;
};

/** An open recruitment round. */
export type Round = {
  title: string;
  poster: Url | null;
  opens_at: IsoDate;
  closes_at: IsoDate;
  extended_to: IsoDate | null;
  qualifications: Qualifications | null;
  positions: Position[];
  timeline: TimelineEvent[];
  apply_url: Url | null;
  /** The project's name; `null` for a round not tied to one project. */
  project_name: string | null;
};

export type Achievement = {
  year: number | null;
  text: string;
  pics: Url[];
  /** The project's name, shown as plain text (never a link). */
  project_name: string;
};

// ---------------------------------------------------------------------------
// Blocks (docs/DATABASE.md "Blocks", filled in as in docs/API.md)

type BlockBase<T extends string> = {
  /** Unique within the page; also the block's #anchor. */
  id: string;
  type: T;
  title: string | null;
};

export type ButtonLink = {
  label: string;
  url: string;
  style: "primary" | "secondary" | null;
};

// Content blocks

export type HeroBlock = BlockBase<"hero"> & {
  media_url: Url;
  subtitle: string | null;
  media_kind: "image" | "video" | "slideshow" | null;
  slides: Url[];
  /** `null` uses the client's default (5 seconds). */
  slide_seconds: number | null;
  buttons: ButtonLink[];
};

export type ArticleBlock = BlockBase<"article"> & {
  /** Markdown. Rendered without raw HTML. */
  body: string;
  image: Url | null;
  image_side: "left" | "right" | "top" | null;
};

export type ImageBlock = BlockBase<"image"> & {
  url: Url;
  alt: string | null;
  caption: string | null;
  credit: string | null;
  size: "normal" | "large" | null;
};

export type QuoteBlock = BlockBase<"quote"> & {
  text: string;
  who: string;
  role: string | null;
  background_image: Url | null;
  background_color: string | null;
};

export type GalleryBlock = BlockBase<"gallery"> & {
  items: { url: Url; alt: string | null; desc: string | null }[];
};

export type VideoBlock = BlockBase<"video"> & {
  videos: {
    url: Url;
    provider: "youtube" | "tiktok" | "instagram" | "drive";
    title: string | null;
    caption: string | null;
  }[];
};

export type ButtonBlock = BlockBase<"button"> & {
  buttons: ButtonLink[];
  align: "left" | "center" | null;
};

export type StatsBlock = BlockBase<"stats"> & {
  items: { label: string; value: number | string; note: string | null }[];
};

// Data blocks: stored pointer fields, plus the data the server filled in

export type HighlightsBlock = BlockBase<"highlights"> & {
  project_slug: string | null;
  limit: number | null;
  highlights: Highlight[];
};

export type TeamBlock = BlockBase<"team"> & {
  project_slug: string | null;
  /** Empty means all departments. */
  dept_keys: string[];
  show_org_chart: boolean | null;
  layout: "list" | "yearbook" | null;
  /** `null` unless `show_org_chart`. */
  org_chart_image: Url | null;
  departments: Department[];
};

export type SponsorsBlock = BlockBase<"sponsors"> & {
  project_slug: string | null;
  /** Empty means all tiers. */
  tiers: string[];
  sponsors: Sponsor[];
};

export type JoinBlock = BlockBase<"join"> & {
  project_slug: string | null;
  /** Shown when no round is open. */
  empty_text: string | null;
  rounds: Round[];
};

export type ProjectsBlock = BlockBase<"projects"> & {
  limit: number | null;
  projects: ProjectCard[];
};

export type TracksBlock = BlockBase<"tracks"> & {
  tracks: TrackCard[];
};

export type YearbookBlock = BlockBase<"yearbook"> & {
  limit: number | null;
  projects: YearbookCard[];
};

export type ContentBlock =
  | HeroBlock
  | ArticleBlock
  | ImageBlock
  | QuoteBlock
  | GalleryBlock
  | VideoBlock
  | ButtonBlock
  | StatsBlock;

export type DataBlock =
  | HighlightsBlock
  | TeamBlock
  | SponsorsBlock
  | JoinBlock
  | ProjectsBlock
  | TracksBlock
  | YearbookBlock;

export type Block = ContentBlock | DataBlock;
export type BlockType = Block["type"];

// ---------------------------------------------------------------------------
// Endpoint responses

/** GET /api/pages/home */
export type HomePage = {
  key: string;
  title: string;
  blocks: Block[];
};

/** GET /api/projects (newest first) */
export type ProjectList = ProjectCard[];

/** GET /api/projects/:slug */
export type ProjectPage = {
  slug: string;
  name: string;
  start_date: IsoDate;
  end_date: IsoDate | null;
  venue: string | null;
  /** At most one item: pics[0]. */
  pics: Url[];
  is_yearbook_shown: boolean;
  blocks: Block[];
};

/** GET /api/projects/:slug/yearbook */
export type Yearbook = {
  slug: string;
  name: string;
  /** At most one item: pics[0]. */
  pics: Url[];
  departments: Department[];
};

/** GET /api/tracks (by `order`) */
export type TrackList = { key: string; display_name: string; desc: string | null }[];

/** GET /api/tracks/:key */
export type TrackDetail = {
  key: string;
  display_name: string;
  desc: string | null;
  pics: Url[];
  achievements: Achievement[];
};

/** GET /api/join (closing soonest first) */
export type OpenRounds = Round[];
