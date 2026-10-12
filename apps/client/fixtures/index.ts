import { homePage } from "./home";
import { openRounds } from "./join";
import { projectList, projectPages, yearbooks } from "./projects";
import { trackDetails, trackList } from "./tracks";

export { HIDDEN_SLUG, NO_YEARBOOK_SLUG, TCOS2_SLUG } from "./shared";

/** A record lookup that ignores inherited keys ("constructor", "__proto__" ...). */
function own<T>(record: Record<string, T>, key: string): T | undefined {
  return Object.hasOwn(record, key) ? record[key] : undefined;
}

/**
 * Answers a public API path from the fixtures, as the server would:
 * the response body, or `undefined` where the server answers 404.
 */
export function fixtureResponse(path: string): unknown {
  const parts = path.split("/").filter(Boolean).map(decodeURIComponent);
  if (parts[0] !== "api") return undefined;
  const [, resource, id, sub, ...rest] = parts;
  if (rest.length > 0) return undefined;

  switch (resource) {
    case "pages":
      return id === "home" && !sub ? homePage : undefined;
    case "projects":
      if (!id) return projectList;
      if (!sub) return own(projectPages, id);
      return sub === "yearbook" ? own(yearbooks, id) : undefined;
    case "tracks":
      if (sub) return undefined;
      return id ? own(trackDetails, id) : trackList;
    case "join":
      return id ? undefined : openRounds;
    default:
      return undefined;
  }
}
