// Pieces used by more than one fixture. Values come from the examples in
// docs/DATABASE.md; anything the docs do not give stays "<...>".
import type { Department, ProjectCard, Round, Sponsor, YearbookCard } from "@/types/api";

export const TCOS2_SLUG = "tcos-2-the-hidden-saloon";
export const TCOS2_NAME = "ทำนองของสายฝน : The Hidden Saloon The Musical";

/** A shown project with no yearbook (is_yearbook_shown: false). */
export const NO_YEARBOOK_SLUG = "placeholder-no-yearbook";

/**
 * A hidden project (is_shown: false). The server never sends it, so it appears
 * in no list, and its page, its yearbook and any achievement on it are left out.
 */
export const HIDDEN_SLUG = "placeholder-hidden";

export const tcos2Card = {
  slug: TCOS2_SLUG,
  name: TCOS2_NAME,
  start_date: "2025-06-28T00:00:00.000Z",
  pics: [],
} satisfies ProjectCard;

export const noYearbookCard = {
  slug: NO_YEARBOOK_SLUG,
  name: "<...>",
  start_date: "<...>",
  pics: [],
} satisfies ProjectCard;

export const tcos2YearbookCard = {
  slug: TCOS2_SLUG,
  name: TCOS2_NAME,
  pics: [],
} satisfies YearbookCard;

export const tcos2Departments = [
  {
    dept_key: "<track to confirm>",
    dept_name: "ทีมโฆษณา (Advertising)",
    members: [
      // is_photo_allowed is false, so the server sends no photo
      { name: "<first name surname>", nickname: "กานต์", position: "<...>", photo: null },
    ],
  },
] satisfies Department[];

export const lidoConnect = {
  name: "Lido Connect",
  // logo_permission is false, so the server sends no logo
  logo: null,
  tier: "<...>",
} satisfies Sponsor;

/** TCOS 2, round 5: MC and ushers. */
export const tcos2Round5 = {
  title: "<...>",
  poster: "<...>",
  opens_at: "2025-04-28T00:00:00.000Z",
  closes_at: "2025-05-01T00:00:00.000Z",
  extended_to: null,
  qualifications: { age_min: 14, age_max: 22, age_note: null, items: ["<...>"] },
  positions: [
    {
      dept_key: "<track to confirm>",
      dept_name: "MC and ushers",
      unit_name: null,
      title: "พิธีกร",
      description: null,
      requirements: [],
      portfolio_required: null,
      onsite_required: null,
      audition: {
        clip_required: true,
        clip_brief: "A clip introducing TCOS (who, what, why), plus a self-introduction clip",
        clip_max_minutes: 5,
        clip_file_name: "พิธีกร_ชื่อจริง-นามสกุล_ชื่อเล่น",
        clip_upload: "public Google Drive link",
        pieces: [],
        onsite: null,
      },
    },
  ],
  timeline: [
    {
      start_date: "2025-04-28T00:00:00.000Z",
      end_date: "2025-05-01T00:00:00.000Z",
      event_name: "Apply",
      event_description: "Google Form",
      location: null,
    },
    { start_date: "<...>", end_date: null, event_name: "Interview", event_description: "Google Meet", location: null },
    { start_date: "<...>", end_date: null, event_name: "First meet", event_description: "<...>", location: "<venue>" },
  ],
  apply_url: "<...>",
  project_name: TCOS2_NAME,
} satisfies Round;
