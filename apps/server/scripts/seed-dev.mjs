// Sample data for testing the API by hand (dev database only).
//
//   npm run seed:dev            add the sample data (replaces earlier sample data)
//   npm run seed:dev -- --clear remove it
//
// Every text is "<...>" (AGENTS.md: never invent names, numbers, dates or wording),
// every slug/key starts with "sample-", sample rounds are titled "[sample] <...>",
// and a sample Home page is only added when there is no Home page yet.
// --clear removes exactly these documents and nothing else.
// Reads MONGODB_URI from .dev.vars. Prints no connection details.
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set. Fill it in .dev.vars (see .dev.vars.example).");
  process.exit(1);
}

const SAMPLE = /^sample-/;
const ROUND_TITLE = "[sample] <...>";
const PAGE_TITLE = "[sample] <...>";

const id = () => new ObjectId();
const DAY = 86_400_000;
const fromNow = (days) => new Date(Date.now() + days * DAY);
const date = (iso) => new Date(`${iso}T00:00:00.000Z`);

// ---------------------------------------------------------------------------
// Data. Each case the public API handles has at least one document.

const member = (dept_key, overrides = {}) => ({
  _id: id(),
  name: "<first name surname>",
  nickname: "<...>",
  dept_key,
  dept_name: "<...>",
  position: "<...>",
  is_shown: true,
  ...overrides,
});

const projects = [
  {
    slug: "sample-project-new",
    name: "<...>",
    type: "stage_play",
    status: "completed",
    start_date: date("2025-06-28"),
    end_date: date("2025-06-29"),
    venue: "<...>",
    summary: "<...>",
    org_chart_image: "<...>",
    pics: ["<...>", "<...>"],
    is_yearbook_shown: true,
    is_shown: true,
    team: [
      member("sample-track-a", { dept_name: "<A>", photo: "<photo allowed>", is_photo_allowed: true }),
      member("sample-track-a", { dept_name: "<A>", is_photo_allowed: false }), // no consent: no photo stored
      member("sample-track-b", { dept_name: "<B>" }),
      member("sample-track-b", { dept_name: "<B>", name: "<hidden person>", is_shown: false }),
    ],
    sponsors: [
      { _id: id(), name: "<...>", logo: "<logo allowed>", logo_permission: true, tier: "<...>", is_shown: true },
      { _id: id(), name: "<...>", logo: "<logo not allowed>", logo_permission: false, tier: null, is_shown: true },
      { _id: id(), name: "<hidden sponsor>", is_shown: false },
    ],
    highlights: [
      { _id: id(), event_name: "<...>", date: date("2025-06-28"), venue: "<...>", desc: "<...>", pics: ["<...>"], is_shown: true },
      { _id: id(), event_name: "<hidden highlight>", is_shown: false },
    ],
    blocks: [
      { id: "story", type: "article", title: "<...>", body: "<...>", image: null, image_side: "right", is_shown: true },
      { id: "team", type: "team", title: "<...>", project_slug: null, dept_keys: [], show_org_chart: true, layout: "list", is_shown: true },
      { id: "sponsors", type: "sponsors", title: "<...>", project_slug: null, tiers: [], is_shown: true },
      { id: "highlights", type: "highlights", title: "<...>", project_slug: null, limit: 3, is_shown: true },
      { id: "join", type: "join", title: "<...>", project_slug: null, empty_text: "<...>", is_shown: true },
      { id: "hidden-block", type: "article", body: "<hidden block>", is_shown: false },
    ],
  },
  {
    slug: "sample-project-old",
    name: "<...>",
    type: "camp",
    status: "completed",
    start_date: date("2024-03-01"),
    end_date: null,
    venue: null,
    pics: [],
    is_yearbook_shown: false, // its yearbook answers 404
    is_shown: true,
    blocks: [{ id: "quote", type: "quote", text: "<...>", who: "<...>", is_shown: true }],
  },
  {
    slug: "sample-project-hidden", // answers 404; its name must never appear
    name: "<hidden project>",
    type: "workshop",
    status: "upcoming",
    start_date: date("2026-01-01"),
    is_yearbook_shown: true,
    is_shown: false,
  },
];

const tracks = [
  {
    key: "sample-track-a",
    display_name: "<...>",
    desc: "<...>",
    pics: ["<...>"],
    order: 1,
    is_shown: true,
    achievements: [
      { _id: id(), project_slug: "sample-project-new", year: 2025, text: "<...>", pics: [], is_shown: true },
      { _id: id(), project_slug: "sample-project-old", year: null, text: "<...>", is_shown: true },
      { _id: id(), project_slug: "sample-project-hidden", text: "<achievement of a hidden project>", is_shown: true },
      { _id: id(), project_slug: "sample-project-new", text: "<hidden achievement>", is_shown: false },
    ],
  },
  { key: "sample-track-b", display_name: "<...>", order: 2, is_shown: true },
  { key: "sample-track-hidden", display_name: "<hidden track>", order: 0, is_shown: false },
];

const round = (overrides) => ({
  title: ROUND_TITLE,
  project_slug: null,
  opens_at: fromNow(-7),
  closes_at: fromNow(14),
  extended_to: null,
  qualifications: { age_min: 15, age_max: 25, age_note: "<...>", items: ["<...>"] },
  positions: [
    {
      _id: id(),
      dept_key: "sample-track-a",
      dept_name: "<...>",
      unit_name: null,
      title: "<...>",
      description: "<...>",
      requirements: ["<...>"],
      portfolio_required: true,
      onsite_required: false,
      audition: { clip_required: true, clip_brief: "<...>", clip_max_minutes: 3, pieces: ["<...>"], onsite: false },
      is_shown: true,
    },
    { _id: id(), dept_key: "sample-track-b", title: "<hidden position>", is_shown: false },
  ],
  timeline: [
    { _id: id(), start_date: fromNow(20), end_date: null, event_name: "<...>", event_description: "<...>", location: null, is_shown: true },
    { _id: id(), start_date: fromNow(25), event_name: "<hidden event>", is_shown: false },
  ],
  apply_url: "<...>",
  poster: null,
  is_shown: true,
  ...overrides,
});

const rounds = [
  round({ project_slug: "sample-project-new", closes_at: fromNow(14) }), // open, closes 3rd
  round({ closes_at: fromNow(-1), extended_to: fromNow(3) }), // closed but extended: open, closes 1st
  round({ closes_at: fromNow(7), qualifications: undefined }), // open, closes 2nd
  round({ project_slug: "sample-project-hidden", closes_at: fromNow(30) }), // open, project_name null
  round({ closes_at: fromNow(-2) }), // closed: not listed
  round({ opens_at: fromNow(5), closes_at: fromNow(20) }), // not open yet: not listed
  round({ is_shown: false }), // hidden: not listed
].map((r) => Object.fromEntries(Object.entries(r).filter(([, v]) => v !== undefined)));

const homePage = {
  key: "home",
  title: PAGE_TITLE,
  is_shown: true,
  updated_at: new Date(),
  blocks: [
    { id: "hero", type: "hero", media_url: "<...>", media_kind: "image", slides: [], slide_seconds: null, buttons: [{ label: "<...>", url: "<...>", style: "primary" }], is_shown: true },
    { id: "about", type: "article", title: "<...>", body: "<...>", is_shown: true },
    { id: "image", type: "image", url: "<...>", alt: "<...>", size: "large", is_shown: true },
    { id: "gallery", type: "gallery", items: [{ url: "<...>", alt: "<...>" }, { url: "<...>" }], is_shown: true },
    { id: "video", type: "video", videos: [{ url: "<...>", provider: "youtube" }], is_shown: true },
    { id: "stats", type: "stats", items: [{ label: "<...>", value: "<...>" }], is_shown: true },
    { id: "projects", type: "projects", title: "<...>", limit: 6, is_shown: true },
    { id: "tracks", type: "tracks", title: "<...>", is_shown: true },
    { id: "yearbook", type: "yearbook", title: "<...>", limit: 3, is_shown: true },
    { id: "join", type: "join", title: "<...>", project_slug: null, empty_text: "<...>", is_shown: true },
    { id: "buttons", type: "button", buttons: [{ label: "<...>", url: "<...>" }], align: "center", is_shown: true },
    { id: "hidden", type: "article", body: "<hidden block>", is_shown: false },
  ],
};

// ---------------------------------------------------------------------------

async function clear(db) {
  const removed = {
    projects: (await db.collection("projects").deleteMany({ slug: SAMPLE })).deletedCount,
    tracks: (await db.collection("tracks").deleteMany({ key: SAMPLE })).deletedCount,
    apply: (await db.collection("apply").deleteMany({ title: ROUND_TITLE })).deletedCount,
    pages: (await db.collection("pages").deleteMany({ key: "home", title: PAGE_TITLE })).deletedCount,
  };
  return removed;
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
try {
  await client.connect();
  const db = client.db("tcos");
  const removed = await clear(db);

  if (process.argv.includes("--clear")) {
    console.log("✓ removed sample data:", removed);
  } else {
    await db.collection("projects").insertMany(projects);
    await db.collection("tracks").insertMany(tracks);
    await db.collection("apply").insertMany(rounds);
    const hasHome = await db.collection("pages").countDocuments({ key: "home" });
    if (!hasHome) await db.collection("pages").insertOne(homePage);
    console.log(`✓ added ${projects.length} projects, ${tracks.length} tracks, ${rounds.length} rounds` +
      (hasHome ? " (kept the existing Home page)" : ", 1 Home page"));
    console.log("  Remove with: npm run seed:dev -- --clear");
  }
} catch (err) {
  if (err?.code === 121) {
    console.error("✗ the database rejected a sample document (schema validation):");
    console.error(JSON.stringify(err.errInfo?.details ?? {}, null, 2).slice(0, 2000));
  } else {
    console.error(`✗ ${err?.name}: ${err?.message?.replace(/\/\/[^@\s]+@/g, "//***@")}`);
  }
  process.exitCode = 1;
} finally {
  await client.close();
}
