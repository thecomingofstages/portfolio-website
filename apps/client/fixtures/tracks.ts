import type { TrackDetail, TrackList } from "@/types/api";
import { TCOS2_NAME } from "./shared";

/** GET /api/tracks */
export const trackList = [
  { key: "it", display_name: "IT", desc: "<...>" },
  { key: "production", display_name: "<...>", desc: "<...>" },
] satisfies TrackList;

/** GET /api/tracks/:key, by key. A key not here is a 404. */
export const trackDetails: Record<string, TrackDetail> = {
  it: {
    key: "it",
    display_name: "IT",
    desc: "<...>",
    pics: [],
    achievements: [{ year: 2025, text: "<...>", pics: [], project_name: TCOS2_NAME }],
  },
  production: {
    key: "production",
    display_name: "<...>",
    desc: "<...>",
    pics: [],
    // This track also has an achievement on the hidden project
    // (placeholder-hidden). The server leaves it out, so it is not here.
    achievements: [],
  },
};
