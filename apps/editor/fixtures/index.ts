import type { PageDoc, ProjectDoc, RoundDoc, TrackDoc } from "@/types/admin";

/**
 * Admin API documents for USE_FIXTURES=true, in their stored shape (is_shown on
 * every block and item). Values come from the examples in docs/DATABASE.md, as
 * in the client's fixtures; anything the docs do not give stays "<...>".
 */

export const TCOS2_SLUG = "tcos-2-the-hidden-saloon";
/** A shown project with no yearbook (is_yearbook_shown: false). */
export const NO_YEARBOOK_SLUG = "placeholder-no-yearbook";
/** A hidden project (is_shown: false): the editor lists it, the public site does not. */
export const HIDDEN_SLUG = "placeholder-hidden";

export const homePage: PageDoc = {
  key: "home",
  title: "The Coming of Stages",
  is_shown: true,
  blocks: [
    {
      id: "hero",
      type: "hero",
      is_shown: true,
      title: "<...>",
      subtitle: "<...>",
      media_url: "<first slide URL>",
      media_kind: "slideshow",
      slides: ["<slide URL>", "<slide URL>"],
      slide_seconds: null,
      buttons: [{ label: "<...>", url: "/join", style: "primary" }],
    },
    { id: "about", type: "article", is_shown: true, title: "<...>", body: "<Markdown text>", image: "<image URL>", image_side: "right" },
    { id: "numbers", type: "stats", is_shown: true, title: null, items: [{ label: "<...>", value: "<...>" }] },
    { id: "projects", type: "projects", is_shown: true, title: "<...>", limit: null },
    { id: "tracks", type: "tracks", is_shown: true, title: "<...>" },
    { id: "join", type: "join", is_shown: true, title: null, project_slug: null, empty_text: "<...>" },
    { id: "quote", type: "quote", is_shown: true, title: null, text: "<...>", who: "<...>", background_image: null, background_color: null },
    { id: "yearbook-list", type: "yearbook", is_shown: true, title: "<...>", limit: null },
    { id: "support", type: "article", is_shown: true, title: "<...>", body: "<...>", image: null, image_side: null },
    { id: "support-benefits", type: "article", is_shown: true, title: null, body: "<...>", image: null, image_side: null },
    {
      id: "support-email",
      type: "button",
      is_shown: true,
      title: null,
      align: "center",
      buttons: [{ label: "<...>", url: "mailto:official_account@thecomingofstages.com", style: "primary" }],
    },
    { id: "partners", type: "sponsors", is_shown: true, title: "<...>", project_slug: null, tiers: [] },
  ],
};

export const projects: ProjectDoc[] = [
  {
    slug: TCOS2_SLUG,
    name: "ทำนองของสายฝน : The Hidden Saloon The Musical",
    type: "stage_play",
    status: "completed",
    start_date: "2025-06-28T00:00:00.000Z",
    end_date: "2025-06-29T00:00:00.000Z",
    venue: "Lido Connect Hall 2",
    summary: "<...>",
    org_chart_image: "<...>",
    pics: [],
    team: [{ _id: "<ObjectId>", is_shown: true }],
    sponsors: [{ _id: "<ObjectId>", is_shown: true }],
    highlights: [{ _id: "<ObjectId>", is_shown: true }],
    blocks: [
      {
        id: "set-photo",
        type: "image",
        is_shown: true,
        url: "<image URL>",
        alt: "<what the picture shows, for screen readers>",
        caption: "<...>",
        credit: "<photographer>",
        size: "large",
      },
      { id: "about", type: "article", is_shown: true, title: "<...>", body: "<Markdown text>", image: "<image URL>", image_side: "right" },
      {
        id: "numbers",
        type: "stats",
        is_shown: true,
        items: [
          { label: "Members", value: 306 },
          { label: "Shows", value: 4 },
        ],
      },
      {
        id: "gallery",
        type: "gallery",
        is_shown: true,
        title: "<...>",
        items: [
          { url: "<image URL>", alt: "<...>", desc: "<what happened in this photo>" },
          { url: "<image URL>", alt: "<...>", desc: "<...>" },
        ],
      },
      {
        id: "documentary",
        type: "video",
        is_shown: true,
        title: "<...>",
        videos: [
          { url: "https://www.youtube.com/watch?v=<id>", provider: "youtube", title: "<episode 1>", caption: "<...>" },
          { url: "https://www.youtube.com/watch?v=<id>", provider: "youtube", title: "<episode 2>", caption: "<...>" },
        ],
      },
      { id: "highlights", type: "highlights", is_shown: true, project_slug: null, limit: 6 },
      { id: "team", type: "team", is_shown: true, project_slug: null, dept_keys: [], show_org_chart: true, layout: "list" },
      {
        id: "quote-kan",
        type: "quote",
        is_shown: true,
        text: "มันส์ เฟรนลี่ สนุกแน่นอน ขอให้โชคดีครับทุกคน มีอะไรก็ใส่ให้สุด คิดอะไรไม่ออก ก็ลองยิ้มเข้าไว้ เดี๋ยวมันก็มาเอง :)",
        who: "กานต์",
        role: "ทีมโฆษณา (Advertising)",
        background_image: "<image URL>",
        background_color: null,
      },
      { id: "partners", type: "sponsors", is_shown: true, title: "<...>", project_slug: null, tiers: [] },
    ],
    is_yearbook_shown: true,
    is_shown: true,
  },
  {
    slug: NO_YEARBOOK_SLUG,
    name: "<...>",
    type: "<...>",
    status: "<...>",
    start_date: "<...>",
    end_date: null,
    venue: null,
    pics: [],
    blocks: [{ id: "about", type: "article", is_shown: true, title: "<...>", body: "<Markdown text>", image: null, image_side: null }],
    is_yearbook_shown: false,
    is_shown: true,
  },
  {
    slug: HIDDEN_SLUG,
    name: "<...>",
    type: "<...>",
    status: "<...>",
    start_date: "<...>",
    end_date: null,
    venue: null,
    pics: [],
    blocks: [],
    is_yearbook_shown: false,
    is_shown: false,
  },
];

/** The track example in docs/DATABASE.md "Full document examples". Item ids are made up: the server assigns real ones. */
export const tracks: TrackDoc[] = [
  {
    _id: "6600000000000000000000a1",
    key: "it",
    display_name: "IT",
    desc: "<...>",
    pics: [],
    achievements: [
      { _id: "6600000000000000000000b1", project_slug: TCOS2_SLUG, year: 2025, text: "<...>", pics: [], is_shown: true },
    ],
    is_shown: false,
  },
];

/** The recruitment round example in docs/DATABASE.md (TCOS 2, round 5: MC and ushers). */
export const ROUND_ID = "6600000000000000000000c1";
export const rounds: RoundDoc[] = [
  {
    _id: ROUND_ID,
    project_slug: TCOS2_SLUG,
    title: "<...>",
    opens_at: "2025-04-28T00:00:00.000Z",
    closes_at: "2025-05-01T00:00:00.000Z",
    extended_to: null,
    qualifications: { age_min: 14, age_max: 22, age_note: null, items: ["<...>"] },
    positions: [
      {
        _id: "6600000000000000000000d1",
        dept_key: "<track to confirm>",
        dept_name: "MC and ushers",
        title: "พิธีกร",
        audition: {
          clip_required: true,
          clip_brief: "A clip introducing TCOS (who, what, why), plus a self-introduction clip",
          clip_max_minutes: 5,
          clip_file_name: "พิธีกร_ชื่อจริง-นามสกุล_ชื่อเล่น",
          clip_upload: "public Google Drive link",
        },
        is_shown: true,
      },
    ],
    timeline: [
      {
        _id: "6600000000000000000000e1",
        start_date: "2025-04-28T00:00:00.000Z",
        end_date: "2025-05-01T00:00:00.000Z",
        event_name: "Apply",
        event_description: "Google Form",
        location: null,
        is_shown: true,
      },
      { _id: "6600000000000000000000e2", start_date: "<...>", event_name: "Interview", event_description: "Google Meet", location: null, is_shown: true },
      { _id: "6600000000000000000000e3", start_date: "<...>", event_name: "First meet", event_description: "<...>", location: "<venue>", is_shown: true },
    ],
    apply_url: "<...>",
    poster: "<...>",
    is_shown: false,
  },
];
