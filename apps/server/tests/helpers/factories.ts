/**
 * Builders for stored documents, with the required fields filled in.
 * Content values stay "<...>" (AGENTS.md: never invent names, dates or wording);
 * pass what a test needs as overrides.
 */
import { ObjectId } from "mongodb";
import type { PageDoc, ProjectDoc, TeamMember, TrackDoc } from "../../src/app/models";

export function makeProject(overrides: Partial<ProjectDoc> = {}): ProjectDoc {
  return {
    slug: "test-project",
    name: "<...>",
    type: "stage_play",
    status: "completed",
    start_date: new Date("2000-01-01T00:00:00.000Z"),
    is_shown: true,
    ...overrides,
  };
}

export function makeTeamMember(overrides: Partial<TeamMember> = {}): TeamMember {
  return {
    _id: new ObjectId(),
    name: "<first name surname>",
    dept_key: "test-track",
    position: "<...>",
    is_shown: true,
    ...overrides,
  };
}

export function makeTrack(overrides: Partial<TrackDoc> = {}): TrackDoc {
  return { key: "test-track", display_name: "<...>", is_shown: true, ...overrides };
}

export function makePage(overrides: Partial<PageDoc> = {}): PageDoc {
  return { key: "home", title: "<...>", blocks: [], is_shown: true, ...overrides };
}
