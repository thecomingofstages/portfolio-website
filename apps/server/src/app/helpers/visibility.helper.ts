/**
 * The visibility filter (task S2). Shared: every public endpoint sends its data
 * through these functions, and nothing else decides what the public may see.
 *
 * Rules (AGENTS.md "Privacy and consent", docs/API.md "Parts"):
 * - Only `is_shown: true` documents and items. A missing flag counts as hidden.
 * - `photo` only where `is_photo_allowed` is true, else null.
 * - `logo` only where `logo_permission` is true, else null.
 * - No `_id`, `is_shown`, `is_photo_allowed` or `logo_permission` in the output.
 *
 * Each `public*` function copies an allow-list of fields, so a field added to the
 * database later cannot leak until someone adds it here on purpose.
 * Queries should still filter with `{ is_shown: true }`; this is the second guard.
 */
import type {
  AchievementItem,
  Audition,
  Block,
  HighlightItem,
  PositionItem,
  SponsorItem,
  TeamMember,
  TimelineItem,
} from "../models";
import type {
  PublicAchievement,
  PublicAudition,
  PublicBlock,
  PublicHighlight,
  PublicMember,
  PublicPosition,
  PublicSponsor,
  PublicTimelineEvent,
} from "../types/public";

/** True only for `is_shown === true`: missing, null or any other value is hidden. */
export function isShown(doc: { is_shown?: unknown } | null | undefined): boolean {
  return doc?.is_shown === true;
}

/** The shown items of a list, in their order. A missing list is []. */
export function shown<T extends { is_shown?: unknown }>(list: readonly T[] | null | undefined): T[] {
  return (list ?? []).filter(isShown);
}

/** Shown items mapped to their public shape. */
function shownAs<T extends { is_shown?: unknown }, R>(list: readonly T[] | null | undefined, toPublic: (item: T) => R): R[] {
  return shown(list).map(toPublic);
}

const orNull = <T>(value: T | null | undefined): T | null => value ?? null;
const orEmpty = <T>(value: readonly T[] | null | undefined): T[] => [...(value ?? [])];

// ---------------------------------------------------------------------------
// projects.team[], projects.sponsors[], projects.highlights[]

export function publicMember(m: TeamMember): PublicMember {
  return {
    name: m.name,
    nickname: orNull(m.nickname),
    position: m.position,
    // Checked here even though the validator rejects a photo without consent:
    // validationLevel "moderate" lets older documents through unchecked.
    photo: m.is_photo_allowed === true ? orNull(m.photo) : null,
  };
}

/** Shown team members, public shape. `dept_key`/`dept_name` stay for grouping (S3). */
export function publicTeam(team: readonly TeamMember[] | null | undefined) {
  return shown(team).map((m) => ({ dept_key: m.dept_key, dept_name: orNull(m.dept_name), member: publicMember(m) }));
}

export function publicSponsor(s: SponsorItem): PublicSponsor {
  return {
    name: s.name,
    logo: s.logo_permission === true ? orNull(s.logo) : null,
    tier: orNull(s.tier),
  };
}

export const publicSponsors = (list: readonly SponsorItem[] | null | undefined) => shownAs(list, publicSponsor);

export function publicHighlight(h: HighlightItem): PublicHighlight {
  return {
    event_name: h.event_name,
    date: orNull(h.date),
    venue: orNull(h.venue),
    desc: orNull(h.desc),
    pics: orEmpty(h.pics),
  };
}

export const publicHighlights = (list: readonly HighlightItem[] | null | undefined) => shownAs(list, publicHighlight);

// ---------------------------------------------------------------------------
// tracks.achievements[]

export function publicAchievement(a: AchievementItem): PublicAchievement {
  return { project_slug: a.project_slug, year: orNull(a.year), text: a.text, pics: orEmpty(a.pics) };
}

export const publicAchievements = (list: readonly AchievementItem[] | null | undefined) => shownAs(list, publicAchievement);

// ---------------------------------------------------------------------------
// apply.positions[], apply.timeline[]

function publicAudition(a: Audition | null | undefined): PublicAudition | null {
  if (!a) return null;
  return {
    clip_required: orNull(a.clip_required),
    clip_brief: orNull(a.clip_brief),
    clip_max_minutes: orNull(a.clip_max_minutes),
    clip_file_name: orNull(a.clip_file_name),
    clip_upload: orNull(a.clip_upload),
    pieces: orEmpty(a.pieces),
    onsite: orNull(a.onsite),
  };
}

export function publicPosition(p: PositionItem): PublicPosition {
  return {
    dept_key: p.dept_key,
    dept_name: orNull(p.dept_name),
    unit_name: orNull(p.unit_name),
    title: p.title,
    description: orNull(p.description),
    requirements: orEmpty(p.requirements),
    portfolio_required: orNull(p.portfolio_required),
    onsite_required: orNull(p.onsite_required),
    audition: publicAudition(p.audition),
  };
}

export const publicPositions = (list: readonly PositionItem[] | null | undefined) => shownAs(list, publicPosition);

export function publicTimelineEvent(t: TimelineItem): PublicTimelineEvent {
  return {
    start_date: t.start_date,
    end_date: orNull(t.end_date),
    event_name: t.event_name,
    event_description: orNull(t.event_description),
    location: orNull(t.location),
  };
}

export const publicTimeline = (list: readonly TimelineItem[] | null | undefined) => shownAs(list, publicTimelineEvent);

// ---------------------------------------------------------------------------
// blocks[] (projects.blocks, pages.blocks)

// Like members and sponsors, each block type copies an allow-list of its fields
// (docs/DATABASE.md "Blocks", apps/client/types/api.ts), so every field the client
// expects is always there: a missing value is null, a missing list is [].
// Block sub-lists (gallery items, buttons, stats, videos) have no flags of their own.

type Raw = Record<string, unknown>;
const str = (v: unknown): string | null => (typeof v === "string" ? v : null);
const num = (v: unknown): number | null => (typeof v === "number" ? v : null);
const bool = (v: unknown): boolean | null => (typeof v === "boolean" ? v : null);
const strList = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
const objList = <R>(v: unknown, map: (o: Raw) => R): R[] =>
  Array.isArray(v) ? v.filter((o): o is Raw => !!o && typeof o === "object").map(map) : [];

const button = (o: Raw) => ({ label: str(o.label), url: str(o.url), style: str(o.style) });

/** Fields per block type, after `id`, `type` and `title`. */
const BLOCK_FIELDS: Record<string, (b: Raw) => Raw> = {
  // Content blocks
  hero: (b) => ({
    media_url: str(b.media_url),
    subtitle: str(b.subtitle),
    media_kind: str(b.media_kind),
    slides: strList(b.slides),
    slide_seconds: num(b.slide_seconds),
    buttons: objList(b.buttons, button),
  }),
  article: (b) => ({ body: str(b.body), image: str(b.image), image_side: str(b.image_side) }),
  image: (b) => ({ url: str(b.url), alt: str(b.alt), caption: str(b.caption), credit: str(b.credit), size: str(b.size) }),
  quote: (b) => ({
    text: str(b.text),
    who: str(b.who),
    role: str(b.role),
    background_image: str(b.background_image),
    background_color: str(b.background_color),
  }),
  gallery: (b) => ({ items: objList(b.items, (o) => ({ url: str(o.url), alt: str(o.alt), desc: str(o.desc) })) }),
  video: (b) => ({
    videos: objList(b.videos, (o) => ({ url: str(o.url), provider: str(o.provider), title: str(o.title), caption: str(o.caption) })),
  }),
  button: (b) => ({ buttons: objList(b.buttons, button), align: str(b.align) }),
  stats: (b) => ({
    items: objList(b.items, (o) => ({
      label: str(o.label),
      value: typeof o.value === "number" || typeof o.value === "string" ? o.value : null,
      note: str(o.note),
    })),
  }),

  // Data blocks: their pointers, plus the data key as [] (or null); blocks.helper.ts fills it in.
  highlights: (b) => ({ project_slug: str(b.project_slug), limit: num(b.limit), highlights: [] }),
  team: (b) => ({
    project_slug: str(b.project_slug),
    dept_keys: strList(b.dept_keys),
    show_org_chart: bool(b.show_org_chart),
    layout: str(b.layout),
    org_chart_image: null,
    departments: [],
  }),
  sponsors: (b) => ({ project_slug: str(b.project_slug), tiers: strList(b.tiers), sponsors: [] }),
  join: (b) => ({ project_slug: str(b.project_slug), empty_text: str(b.empty_text), rounds: [] }),
  projects: (b) => ({ limit: num(b.limit), projects: [] }),
  tracks: () => ({ tracks: [] }),
  yearbook: (b) => ({ limit: num(b.limit), projects: [] }),
};

/** Block types the API knows. Any other stored type is not sent at all. */
export const BLOCK_TYPES = Object.keys(BLOCK_FIELDS);

/**
 * A block in its public shape, or null for a type the API does not know.
 * Unknown fields are dropped; known ones are always present (null / []).
 */
export function publicBlock(b: Block): PublicBlock | null {
  const fields = BLOCK_FIELDS[b.type];
  if (!fields) return null;
  return { id: b.id, type: b.type, title: orNull(b.title), ...fields(b as Raw) };
}

/** Shown blocks of known types, in their order. */
export function publicBlocks(list: readonly Block[] | null | undefined): PublicBlock[] {
  return shown(list)
    .map(publicBlock)
    .filter((b): b is PublicBlock => b !== null);
}
