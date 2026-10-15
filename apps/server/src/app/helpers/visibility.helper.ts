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

/**
 * A shown block as stored, without `is_shown` (docs/API.md "Blocks").
 * Block sub-lists (gallery items, buttons, stats, videos) have no flags of their own.
 * Data blocks hold only pointers here; S4 fills in their data through the functions above.
 */
export function publicBlock(b: Block): PublicBlock {
  const { is_shown: _hidden, ...rest } = b;
  return { ...rest, title: orNull(b.title) };
}

export const publicBlocks = (list: readonly Block[] | null | undefined) => shownAs(list, publicBlock);
