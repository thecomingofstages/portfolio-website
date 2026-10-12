import type { ProjectList, ProjectPage, Yearbook } from "@/types/api";
import {
  NO_YEARBOOK_SLUG,
  TCOS2_NAME,
  TCOS2_SLUG,
  lidoConnect,
  noYearbookCard,
  tcos2Card,
  tcos2Departments,
} from "./shared";

/** GET /api/projects. The hidden project is not in it. */
export const projectList = [tcos2Card, noYearbookCard] satisfies ProjectList;

/** GET /api/projects/:slug, by slug. A slug not here (e.g. the hidden one) is a 404. */
export const projectPages: Record<string, ProjectPage> = {
  [TCOS2_SLUG]: {
    slug: TCOS2_SLUG,
    name: TCOS2_NAME,
    start_date: "2025-06-28T00:00:00.000Z",
    end_date: "2025-06-29T00:00:00.000Z",
    venue: "Lido Connect Hall 2",
    pics: [],
    is_yearbook_shown: true,
    blocks: [
      {
        id: "set-photo",
        type: "image",
        title: null,
        url: "<image URL>",
        alt: "<what the picture shows, for screen readers>",
        caption: "<...>",
        credit: "<photographer>",
        size: "large",
      },
      {
        id: "about",
        type: "article",
        title: "<...>",
        body: "<Markdown text>",
        image: "<image URL>",
        image_side: "right",
      },
      {
        id: "numbers",
        type: "stats",
        title: null,
        items: [
          { label: "Members", value: 306, note: null },
          { label: "Shows", value: 4, note: null },
        ],
      },
      {
        id: "gallery",
        type: "gallery",
        title: "<...>",
        items: [
          { url: "<image URL>", alt: "<...>", desc: "<what happened in this photo>" },
          { url: "<image URL>", alt: "<...>", desc: "<...>" },
        ],
      },
      {
        id: "documentary",
        type: "video",
        title: "<...>",
        videos: [
          { url: "https://www.youtube.com/watch?v=<id>", provider: "youtube", title: "<episode 1>", caption: "<...>" },
          { url: "https://www.youtube.com/watch?v=<id>", provider: "youtube", title: "<episode 2>", caption: "<...>" },
        ],
      },
      {
        id: "highlights",
        type: "highlights",
        title: null,
        project_slug: null,
        limit: 6,
        highlights: [
          {
            event_name: "รอบสื่อ",
            date: "2025-06-28T00:00:00.000Z",
            venue: "Lido Connect Hall 2",
            desc: "<...>",
            pics: [],
          },
        ],
      },
      {
        id: "team",
        type: "team",
        title: null,
        project_slug: null,
        dept_keys: [],
        show_org_chart: true,
        layout: "list",
        org_chart_image: "<...>",
        departments: tcos2Departments,
      },
      {
        id: "quote-kan",
        type: "quote",
        title: null,
        text: "มันส์ เฟรนลี่ สนุกแน่นอน ขอให้โชคดีครับทุกคน มีอะไรก็ใส่ให้สุด คิดอะไรไม่ออก ก็ลองยิ้มเข้าไว้ เดี๋ยวมันก็มาเอง :)",
        who: "กานต์",
        role: "ทีมโฆษณา (Advertising)",
        background_image: "<image URL>",
        background_color: null,
      },
      {
        id: "partners",
        type: "sponsors",
        title: "<...>",
        project_slug: null,
        tiers: [],
        sponsors: [lidoConnect],
      },
    ],
  },
  [NO_YEARBOOK_SLUG]: {
    slug: NO_YEARBOOK_SLUG,
    name: "<...>",
    start_date: "<...>",
    end_date: null,
    venue: null,
    pics: [],
    is_yearbook_shown: false,
    blocks: [
      { id: "about", type: "article", title: "<...>", body: "<Markdown text>", image: null, image_side: null },
    ],
  },
};

/**
 * GET /api/projects/:slug/yearbook, by slug. Only projects with
 * is_yearbook_shown; the no-yearbook and hidden projects are a 404.
 */
export const yearbooks: Record<string, Yearbook> = {
  [TCOS2_SLUG]: {
    slug: TCOS2_SLUG,
    name: TCOS2_NAME,
    pics: [],
    departments: tcos2Departments,
  },
};
