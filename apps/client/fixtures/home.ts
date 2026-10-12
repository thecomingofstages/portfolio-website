import type { HomePage } from "@/types/api";
import { lidoConnect, noYearbookCard, tcos2Card, tcos2YearbookCard } from "./shared";
import { trackList } from "./tracks";

/** GET /api/pages/home, in the block order of docs/DATABASE.md "Home". */
export const homePage = {
  key: "home",
  title: "The Coming of Stages",
  blocks: [
    {
      id: "hero",
      type: "hero",
      title: "The Coming of Stages",
      subtitle: "เด็กไทยติดเวที",
      media_url: "<first slide URL>",
      media_kind: "slideshow",
      slides: ["<slide URL>", "<slide URL>"],
      slide_seconds: null,
      buttons: [{ label: "<...>", url: "/join", style: "primary" }],
    },
    { id: "about", type: "article", title: "<...>", body: "<Markdown text>", image: "<image URL>", image_side: "right" },
    { id: "numbers", type: "stats", title: null, items: [{ label: "<...>", value: "<...>", note: null }] },
    { id: "projects", type: "projects", title: "<...>", limit: null, projects: [tcos2Card, noYearbookCard] },
    {
      id: "tracks",
      type: "tracks",
      title: "<...>",
      tracks: trackList.map((track) => ({ ...track, pics: [] })),
    },
    // No round open: the block shows its own empty_text.
    { id: "join", type: "join", title: null, project_slug: null, empty_text: "<...>", rounds: [] },
    {
      id: "quote",
      type: "quote",
      title: null,
      text: "<...>",
      who: "<...>",
      role: null,
      background_image: null,
      background_color: null,
    },
    { id: "yearbook-list", type: "yearbook", title: "<...>", limit: null, projects: [tcos2YearbookCard] },
    { id: "support", type: "article", title: "<...>", body: "<...>", image: null, image_side: null },
    { id: "support-benefits", type: "article", title: null, body: "<...>", image: null, image_side: null },
    {
      id: "support-email",
      type: "button",
      title: null,
      align: "center",
      buttons: [{ label: "<...>", url: "mailto:official_account@thecomingofstages.com", style: "primary" }],
    },
    { id: "partners", type: "sponsors", title: "<...>", project_slug: null, tiers: [], sponsors: [lidoConnect] },
  ],
} satisfies HomePage;
