import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { toObjectId, withId } from "../src/app/database/db";
import { ApiError } from "../src/app/utils/ApiError";
import { makeTeamMember } from "./helpers/factories";

describe("toObjectId", () => {
  it("turns a 24-hex string into an ObjectId", () => {
    const id = new ObjectId().toHexString();
    expect(toObjectId(id).toHexString()).toBe(id);
  });

  it.each(["", "abc", "zzzzzzzzzzzzzzzzzzzzzzzz", "123456789012", "0".repeat(25)])(
    "answers 400 for %j",
    (bad) => {
      expect(() => toObjectId(bad)).toThrow(ApiError);
      try {
        toObjectId(bad);
      } catch (err) {
        expect((err as ApiError).status).toBe(400);
      }
    },
  );
});

describe("withId", () => {
  it("adds a new _id and keeps the fields", () => {
    const { _id, ...member } = makeTeamMember();
    const item = withId(member);
    expect(item._id).toBeInstanceOf(ObjectId);
    expect(item).toMatchObject(member);
  });

  it("gives each item its own _id", () => {
    expect(withId({})._id.equals(withId({})._id)).toBe(false);
  });
});
