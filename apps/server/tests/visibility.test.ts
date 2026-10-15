/** S2: one test per visibility rule (docs/TASKS.md). */
import { describe, expect, it } from "vitest";
import {
  isShown,
  publicAchievements,
  publicBlocks,
  publicHighlights,
  publicMember,
  publicPositions,
  publicSponsor,
  publicSponsors,
  publicTeam,
  publicTimeline,
  shown,
} from "../src/app/helpers/visibility.helper";
import {
  makeAchievement,
  makeBlock,
  makeHighlight,
  makePosition,
  makeSponsor,
  makeTeamMember,
  makeTimelineEvent,
} from "./helpers/factories";

/** Fields that must never reach the public, at any depth. */
const FORBIDDEN = ["_id", "is_shown", "is_photo_allowed", "logo_permission"];

function forbiddenKeys(value: unknown, path = "$"): string[] {
  if (Array.isArray(value)) return value.flatMap((v, i) => forbiddenKeys(v, `${path}[${i}]`));
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.entries(value).flatMap(([k, v]) =>
      FORBIDDEN.includes(k) ? [`${path}.${k}`] : forbiddenKeys(v, `${path}.${k}`),
    );
  }
  return [];
}

describe("rule 1: only is_shown: true", () => {
  it("isShown accepts only true", () => {
    expect(isShown({ is_shown: true })).toBe(true);
    for (const v of [false, undefined, null, "true", 1]) expect(isShown({ is_shown: v })).toBe(false);
    expect(isShown(null)).toBe(false);
    expect(isShown(undefined)).toBe(false);
  });

  it("shown keeps order, drops hidden and flagless items, and treats a missing list as []", () => {
    const a = makeHighlight({ event_name: "a" });
    const b = makeHighlight({ event_name: "b" });
    const flagless = { ...makeHighlight(), is_shown: undefined } as unknown as typeof a;
    expect(shown([a, makeHighlight({ is_shown: false }), flagless, b])).toEqual([a, b]);
    expect(shown(undefined)).toEqual([]);
    expect(shown(null)).toEqual([]);
  });

  it.each([
    ["team", () => publicTeam([makeTeamMember(), makeTeamMember({ is_shown: false })])],
    ["sponsors", () => publicSponsors([makeSponsor(), makeSponsor({ is_shown: false })])],
    ["highlights", () => publicHighlights([makeHighlight(), makeHighlight({ is_shown: false })])],
    ["achievements", () => publicAchievements([makeAchievement(), makeAchievement({ is_shown: false })])],
    ["positions", () => publicPositions([makePosition(), makePosition({ is_shown: false })])],
    ["timeline", () => publicTimeline([makeTimelineEvent(), makeTimelineEvent({ is_shown: false })])],
    ["blocks", () => publicBlocks([makeBlock(), makeBlock({ id: "hidden", is_shown: false })])],
  ])("%s: hidden items are left out", (_name, run) => {
    expect(run()).toHaveLength(1);
  });

  it("a hidden team member disappears entirely, name included (is_shown is the name consent)", () => {
    const hidden = makeTeamMember({ name: "<hidden person>", is_shown: false });
    expect(JSON.stringify(publicTeam([hidden, makeTeamMember()]))).not.toContain("<hidden person>");
  });
});

describe("rule 2: photo only where is_photo_allowed", () => {
  const photo = "https://media.test/projects/test-project/abc.webp";

  it("sends the photo when allowed", () => {
    expect(publicMember(makeTeamMember({ photo, is_photo_allowed: true })).photo).toBe(photo);
  });

  it.each([
    ["false", false],
    ["missing", undefined],
  ])("sends null when is_photo_allowed is %s, even if a photo is stored", (_label, allowed) => {
    // A stored photo without consent can exist in older data: validators run "moderate".
    const m = makeTeamMember({ photo, is_photo_allowed: allowed });
    expect(publicMember(m).photo).toBeNull();
    expect(JSON.stringify(publicTeam([m]))).not.toContain(photo);
  });

  it("sends null when allowed but there is no photo", () => {
    expect(publicMember(makeTeamMember({ is_photo_allowed: true })).photo).toBeNull();
  });
});

describe("rule 3: logo only where logo_permission", () => {
  const logo = "https://media.test/projects/test-project/logo.webp";

  it("sends the logo with permission", () => {
    expect(publicSponsor(makeSponsor({ logo, logo_permission: true })).logo).toBe(logo);
  });

  it.each([
    ["false", false],
    ["missing", undefined],
  ])("sends null when logo_permission is %s", (_label, permission) => {
    const s = makeSponsor({ logo, logo_permission: permission });
    expect(publicSponsor(s).logo).toBeNull();
    expect(JSON.stringify(publicSponsors([s]))).not.toContain(logo);
  });
});

describe("rule 4: no ids or consent flags in the output", () => {
  it.each([
    ["team", () => publicTeam([makeTeamMember({ photo: "https://media.test/p.webp", is_photo_allowed: true })])],
    ["sponsors", () => publicSponsors([makeSponsor({ logo: "https://media.test/l.webp", logo_permission: true })])],
    ["highlights", () => publicHighlights([makeHighlight()])],
    ["achievements", () => publicAchievements([makeAchievement()])],
    ["positions", () => publicPositions([makePosition({ audition: { onsite: true } })])],
    ["timeline", () => publicTimeline([makeTimelineEvent()])],
    ["blocks", () => publicBlocks([makeBlock()])],
  ])("%s", (_name, run) => {
    expect(forbiddenKeys(run())).toEqual([]);
  });

  it("copies only allow-listed fields, so unknown stored fields cannot leak", () => {
    const m = { ...makeTeamMember(), phone: "<private>", birth_date: new Date() } as ReturnType<typeof makeTeamMember>;
    const out = publicMember(m);
    expect(Object.keys(out).sort()).toEqual(["name", "nickname", "photo", "position"]);
  });
});

describe("shapes: optional fields are null or []", () => {
  it("member", () => {
    expect(publicMember(makeTeamMember())).toEqual({ name: "<first name surname>", nickname: null, position: "<...>", photo: null });
  });

  it("position and audition", () => {
    const [p] = publicPositions([makePosition({ audition: {} })]);
    expect(p).toMatchObject({ dept_name: null, unit_name: null, description: null, requirements: [], portfolio_required: null });
    expect(p?.audition).toMatchObject({ clip_required: null, pieces: [], onsite: null });
    expect(publicPositions([makePosition()])[0]?.audition).toBeNull();
  });

  it("block keeps its own fields and gets title: null", () => {
    expect(publicBlocks([makeBlock()])).toEqual([{ id: "test-block", type: "article", body: "<...>", title: null }]);
  });
});
