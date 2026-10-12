// TCOS portfolio database: projects, tracks, apply and pages, with validators and indexes.
// Run with: mongosh "<connection string>/tcos" tcos_schema.mongodb.js
// Field details and examples: docs/DATABASE.md
// Validators use validationLevel "moderate" so existing documents are not rejected
// while the schema settles. Tighten to "strict" once the data is clean.

const str = { bsonType: "string" };
const str_or_null = { bsonType: ["string", "null"] };
const int = { bsonType: "int", minimum: 0 };
const int_or_null = { bsonType: ["int", "null"] };
const date = { bsonType: "date" };
const date_or_null = { bsonType: ["date", "null"] };
const bool = { bsonType: "bool" };
const str_list = { bsonType: "array", items: str };
const pics = str_list; // image URLs

// Visibility: every document and every listed item carries is_shown.
// The site shows a document or item only when is_shown is true.
const is_shown = bool;

// Items in structured lists carry their own _id, so the admin API can edit one item by id.
// Mongoose adds it on new items; import scripts must set it (new ObjectId()).
const item_id = { bsonType: "objectId" };

// Every collection rejects fields it does not list, so renamed or removed fields cannot linger.
function create(name, schema, indexes) {
  schema = { ...schema, properties: { _id: { bsonType: "objectId" }, ...schema.properties }, additionalProperties: false };
  if (db.getCollectionNames().includes(name)) {
    db.runCommand({ collMod: name, validator: { $jsonSchema: schema }, validationLevel: "moderate" });
  } else {
    db.createCollection(name, { validator: { $jsonSchema: schema }, validationLevel: "moderate" });
  }
  for (const [keys, opts] of indexes) db.getCollection(name).createIndex(keys, opts || {});
}

// --- block_component ---------------------------------------------------------
// A page is an ordered blocks[] array: projects.blocks for project pages, pages.blocks for Home.
// Content blocks hold their own content. Data blocks read the structured fields:
// project_slug null = the page's own project; on Home, null = all shown projects.
// Block ids must be unique within a page (the app checks this; $jsonSchema cannot).

const button = {
  bsonType: "object",
  required: ["label", "url"],
  properties: { label: str, url: str, style: { enum: ["primary", "secondary"] } },
  additionalProperties: false,
};

function block_type(type, required, props) {
  return {
    bsonType: "object",
    required: ["id", "type", "is_shown", ...required],
    properties: {
      id: str, // stable within the page; also the #anchor, e.g. "partners", "contact"
      type: { enum: [type] },
      title: str_or_null, // optional section heading
      is_shown,
      ...props,
    },
    additionalProperties: false,
  };
}

const block_component = {
  oneOf: [
    // Content blocks
    block_type("hero", ["media_url"], {
      subtitle: str,
      media_url: str, // the image or video; for a slideshow, the first slide and the still image when motion is reduced
      media_kind: { enum: ["image", "video", "slideshow"] },
      slides: pics, // slideshow only: the images after media_url, in order
      slide_seconds: int_or_null, // slideshow only: seconds per slide; null = the app's default
      buttons: { bsonType: "array", items: button },
    }),
    block_type("article", ["body"], {
      body: str, // Markdown
      image: str_or_null,
      image_side: { enum: ["left", "right", "top", null] },
    }),
    block_type("image", ["url"], {
      url: str,
      alt: str,
      caption: str,
      credit: str,
      size: { enum: ["normal", "large"] }, // large = full width, e.g. the whole team photo
    }),
    block_type("quote", ["text", "who"], {
      text: str,
      who: str,
      role: str,
      background_image: str_or_null,
      background_color: str_or_null,
    }),
    block_type("gallery", ["items"], {
      items: {
        bsonType: "array",
        items: {
          bsonType: "object",
          required: ["url"],
          properties: { url: str, alt: str, desc: str },
          additionalProperties: false,
        },
      },
    }),
    block_type("video", ["videos"], {
      // One video, or a series such as documentary episodes
      videos: {
        bsonType: "array",
        items: {
          bsonType: "object",
          required: ["url", "provider"],
          properties: {
            url: str,
            provider: { enum: ["youtube", "tiktok", "instagram", "drive"] },
            title: str,
            caption: str,
          },
          additionalProperties: false,
        },
      },
    }),
    block_type("button", ["buttons"], {
      buttons: { bsonType: "array", items: button },
      align: { enum: ["left", "center"] },
    }),
    block_type("stats", ["items"], {
      items: {
        bsonType: "array",
        items: {
          bsonType: "object",
          required: ["label", "value"],
          properties: { label: str, value: { bsonType: ["int", "double", "string"] }, note: str },
          additionalProperties: false,
        },
      },
    }),
    // Data blocks
    block_type("highlights", [], { project_slug: str_or_null, limit: int_or_null }),
    block_type("team", [], {
      project_slug: str_or_null,
      dept_keys: str_list, // empty = every department
      show_org_chart: bool,
      layout: { enum: ["list", "yearbook"] }, // yearbook = photo grid grouped by department
    }),
    block_type("sponsors", [], {
      project_slug: str_or_null,
      tiers: str_list, // empty = every tier; logos only where logo_permission is true
    }),
    block_type("join", [], {
      project_slug: str_or_null, // apply rounds open today
      empty_text: str, // shown when no round is open
    }),
    // Card lists, e.g. on Home. Each card links to its own page.
    block_type("projects", [], { limit: int_or_null }), // shown projects, newest first
    block_type("tracks", [], {}), // shown tracks, by order
    block_type("yearbook", [], { limit: int_or_null }), // shown projects with is_yearbook_shown, newest first
  ],
};

const blocks = { bsonType: "array", items: block_component };

// --- projects ---------------------------------------------------------------
// One document per project: TCOS 1, TCOS 2, RPM 1, HOUSE of TCOS, To Write A Life, RPM Club, RPM 2 ...

create("projects", {
  bsonType: "object",
  required: ["slug", "name", "type", "status", "start_date", "is_shown"],
  properties: {
    slug: str, // "tcos-2-the-hidden-saloon", used in URLs and referenced by tracks and apply
    name: str,
    type: { enum: ["stage_play", "mini_concert", "camp", "club", "workshop", "event", "central_team"] },
    status: { enum: ["upcoming", "recruiting", "in_progress", "completed", "cancelled"] },
    start_date: date, // required: the shelf sorts and filters by it
    end_date: date_or_null,
    venue: str_or_null, // main venue; per-event venues go in highlights
    summary: str, // one or two lines for project cards; page text goes in article blocks
    org_chart_image: str_or_null,
    pics,
    team: {
      bsonType: "array",
      items: {
        bsonType: "object",
        required: ["_id", "name", "dept_key", "position", "is_shown"],
        properties: {
          _id: item_id,
          name: str, // full name, "first name + surname", as shown on the site
          nickname: str,
          dept_key: str, // matches tracks.key
          dept_name: str, // department name as used that year
          position: str,
          photo: str, // yearbook portrait URL
          is_photo_allowed: bool, // set true only after consent (and guardian consent for minors)
          is_shown, // also the name consent: true only after the person (and guardian for a minor) agrees
        },
        // A photo can only be stored when it is allowed. To withdraw: set false and $unset photo.
        dependencies: { photo: { required: ["is_photo_allowed"], properties: { is_photo_allowed: { enum: [true] } } } },
        additionalProperties: false, // no contact or birth-date fields
      },
    },
    sponsors: {
      bsonType: "array",
      items: {
        bsonType: "object",
        required: ["_id", "name", "is_shown"],
        properties: {
          _id: item_id,
          name: str,
          logo: str_or_null,
          logo_permission: bool, // show the logo only when true
          tier: str_or_null, // "Official Sponsor", "Main Sponsor", "Co-Sponsor", "Supporter"
          is_shown,
        },
        additionalProperties: false,
      },
    },
    highlights: {
      bsonType: "array",
      items: {
        bsonType: "object",
        required: ["_id", "event_name", "is_shown"],
        properties: { _id: item_id, event_name: str, date: date_or_null, venue: str_or_null, desc: str, pics, is_shown },
        additionalProperties: false,
      },
    },
    blocks, // the project page body, below the fixed header
    is_yearbook_shown: bool, // turns on /projects/<slug>/yearbook and its links
    is_shown,
  },
}, [
  [{ slug: 1 }, { unique: true }],
  [{ is_shown: 1, start_date: -1 }],
  [{ is_yearbook_shown: 1 }],
  [{ status: 1 }],
]);

// --- tracks (สายงาน) ---------------------------------------------------------
// Stable departments across years. The team is not stored here: query projects.team by dept_key.

create("tracks", {
  bsonType: "object",
  required: ["key", "display_name", "is_shown"],
  properties: {
    key: str, // "production", "event", "film", "it", "marketing", "finance" (to confirm)
    display_name: str,
    desc: str,
    pics,
    achievements: {
      bsonType: "array",
      items: {
        bsonType: "object",
        required: ["_id", "project_slug", "text", "is_shown"],
        properties: { _id: item_id, project_slug: str, year: int_or_null, text: str, pics, is_shown },
        additionalProperties: false,
      },
    },
    order: int,
    is_shown,
  },
}, [[{ key: 1 }, { unique: true }]]);

// --- apply ------------------------------------------------------------------
// One document per recruitment round. Replaces the รายละเอียดเพิ่มเติม PDFs.
// Display only: applications are handled elsewhere, and no applicant data is stored here.
// A round is open when is_shown and opens_at <= now <= (extended_to or closes_at).

const audition = {
  bsonType: "object",
  properties: {
    clip_required: bool,
    clip_brief: str, // e.g. MC clip introducing TCOS: who, what, why
    clip_max_minutes: int_or_null,
    clip_file_name: str, // e.g. "พิธีกร_ชื่อจริง-นามสกุล_ชื่อเล่น"
    clip_upload: str, // e.g. "public Google Drive link"
    pieces: str_list, // songs or monologues to choose from
    onsite: bool, // onsite audition after the clip round
  },
  additionalProperties: false,
};

create("apply", {
  bsonType: "object",
  required: ["title", "opens_at", "closes_at", "positions", "is_shown"],
  properties: {
    project_slug: str_or_null, // projects.slug; null for a round not tied to one project
    title: str,
    opens_at: date,
    closes_at: date,
    extended_to: date_or_null, // e.g. RPM Club staff 16 Apr extended to 23 Apr
    qualifications: {
      bsonType: "object",
      properties: {
        age_min: int_or_null,
        age_max: int_or_null,
        age_note: str_or_null, // e.g. "or M.4 to Year 4"
        items: str_list, // shared text for the round
      },
      additionalProperties: false,
    },
    positions: {
      bsonType: "array",
      items: {
        bsonType: "object",
        required: ["_id", "dept_key", "title", "is_shown"],
        properties: {
          _id: item_id,
          dept_key: str, // matches tracks.key
          dept_name: str, // ฝ่าย as named in this round
          unit_name: str_or_null, // แผนก, when the round lists one
          title: str,
          description: str,
          requirements: str_list,
          portfolio_required: bool,
          onsite_required: bool, // must be able to work onsite in Bangkok
          audition,
          is_shown,
        },
        additionalProperties: false,
      },
    },
    timeline: {
      bsonType: "array",
      items: {
        bsonType: "object",
        required: ["_id", "start_date", "event_name", "is_shown"],
        properties: {
          _id: item_id,
          start_date: date, // may include the time
          end_date: date_or_null,
          event_name: str, // e.g. "Interview"
          event_description: str, // e.g. "Google Meet; make-up day on ..."
          location: str_or_null, // null = online; e.g. "Casa Sardine"
          is_shown,
        },
        additionalProperties: false,
      },
    },
    apply_url: str_or_null, // Google Form
    poster: str_or_null,
    is_shown,
  },
}, [
  [{ project_slug: 1, opens_at: -1 }],
  [{ is_shown: 1, opens_at: 1, closes_at: 1 }],
  [{ "positions.dept_key": 1 }],
]);

// --- pages ------------------------------------------------------------------
// Pages that are not a project: Home now, others (About, Support) later if they need blocks.
// A project page's layout lives in projects.blocks; every other page's layout lives here.

create("pages", {
  bsonType: "object",
  required: ["key", "title", "blocks", "is_shown"],
  properties: {
    key: str, // "home"
    title: str,
    blocks,
    is_shown,
    updated_at: date,
  },
}, [[{ key: 1 }, { unique: true }]]);

print("TCOS schema ready: " + db.getCollectionNames().sort().join(", "));
