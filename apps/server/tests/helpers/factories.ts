/**
 * Builders for stored documents, with the required fields filled in.
 * Content values stay "<...>" (AGENTS.md: never invent names, dates or wording);
 * pass what a test needs as overrides.
 */
import { ObjectId } from "mongodb";
import type {
  AchievementItem,
  Block,
  HighlightItem,
  PageDoc,
  PositionItem,
  ProjectDoc,
  SponsorItem,
  TeamMember,
  TimelineItem,
  TrackDoc,
} from "../../src/app/models";

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

export function makeSponsor(overrides: Partial<SponsorItem> = {}): SponsorItem {
  return { _id: new ObjectId(), name: "<...>", is_shown: true, ...overrides };
}

export function makeHighlight(overrides: Partial<HighlightItem> = {}): HighlightItem {
  return { _id: new ObjectId(), event_name: "<...>", is_shown: true, ...overrides };
}

export function makeAchievement(overrides: Partial<AchievementItem> = {}): AchievementItem {
  return { _id: new ObjectId(), project_slug: "test-project", text: "<...>", is_shown: true, ...overrides };
}

export function makePosition(overrides: Partial<PositionItem> = {}): PositionItem {
  return { _id: new ObjectId(), dept_key: "test-track", title: "<...>", is_shown: true, ...overrides };
}

export function makeTimelineEvent(overrides: Partial<TimelineItem> = {}): TimelineItem {
  return {
    _id: new ObjectId(),
    start_date: new Date("2000-01-01T00:00:00.000Z"),
    event_name: "<...>",
    is_shown: true,
    ...overrides,
  };
}

export function makeBlock(overrides: Partial<Block> = {}): Block {
  return { id: "test-block", type: "article", body: "<...>", is_shown: true, ...overrides };
}
