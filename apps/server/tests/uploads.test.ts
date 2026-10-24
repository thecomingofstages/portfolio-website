/** S8: uploads stream into the media bucket and come back as { key, url }; files can be deleted. */
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { PART_SIZE } from "../src/app/helpers/admin/upload.helper";
import { MEDIA, adminClient, memberBody, projectBody, roundBody, trackBody } from "./helpers/admin";
import { useTestDb } from "./helpers/db";

const db = useTestDb({ schema: true });
let api: Awaited<ReturnType<typeof adminClient>>;

/** A file that starts with `magic` and is `size` bytes long. */
const file = (magic: number[] | string, size = 64) => {
  const head = typeof magic === "string" ? [...magic].map((c) => c.charCodeAt(0)) : magic;
  const out = new Uint8Array(Math.max(size, head.length));
  out.set(head);
  for (let i = head.length; i < out.length; i++) out[i] = i % 251;
  return out;
};
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG = [0xff, 0xd8, 0xff, 0xe0];
const WEBP = [..."RIFF"].map((c) => c.charCodeAt(0)).concat([0, 0, 0, 0], [..."WEBP"].map((c) => c.charCodeAt(0)));
const AVIF = [0, 0, 0, 0x1c, ..."ftypavif"].map((c) => (typeof c === "string" ? c.charCodeAt(0) : c));

const KEY = /^projects\/p\/[0-9a-f]{32}\.(png|jpg|gif|webp|avif)$/;

beforeEach(async () => {
  api = await adminClient(db);
  await api.post("/tracks", trackBody("t"));
  await api.post("/projects", projectBody("p"));
});

describe("POST /api/admin/uploads", () => {
  it("stores a file under <collection>/<owner>/<random>.<ext> and returns { key, url }", async () => {
    const bytes = file(PNG, 1000);
    const res = await api.upload("collection=projects&owner=p", bytes, "Somchai portrait.png");
    expect(res.status).toBe(201);
    expect(res.body.key).toMatch(KEY);
    expect(res.body.url).toBe(`${MEDIA}/${res.body.key}`);
    // The file name (which can hold a person's name) is not used.
    expect(res.body.key).not.toMatch(/somchai|portrait/i);
    const saved = api.stored.get(res.body.key)!;
    expect(saved.bytes).toEqual(bytes);
    expect(saved.type).toBe("image/png");
  });

  it.each([
    ["png", PNG, "image/png"],
    ["jpg", JPEG, "image/jpeg"],
    ["gif", file("GIF89a"), "image/gif"],
    ["webp", WEBP, "image/webp"],
    ["avif", AVIF, "image/avif"],
  ])("accepts %s, recognised from its bytes", async (ext, magic, mime) => {
    const res = await api.upload("collection=projects&owner=p", file(magic as number[]), "no-extension");
    expect(res.status).toBe(201);
    expect(res.body.key.endsWith(`.${ext}`)).toBe(true);
    expect(api.stored.get(res.body.key)?.type).toBe(mime);
  });

  it.each([
    ["SVG (can run scripts)", file('<svg xmlns="http://www.w3.org/2000/svg"><script>'), "a.svg"],
    ["HTML", file("<!doctype html><script>"), "a.html"],
    ["an HTML file named .png", file("<html><script>alert(1)"), "photo.png"],
    ["a PDF", file("%PDF-1.7"), "a.pdf"],
    ["a program", file("MZ\x90\x00"), "a.exe"],
  ])("refuses %s, whatever its name says", async (_label, bytes, name) => {
    const res = await api.upload("collection=projects&owner=p", bytes, name);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/type not allowed/);
    expect(api.stored.size).toBe(0);
  });

  it("streams a large file to R2 in 5 MiB parts, and the parts add up to the file", async () => {
    const bytes = file(JPEG, 2 * PART_SIZE + 1234);
    const res = await api.upload("collection=projects&owner=p", bytes, "big.jpg");
    expect(res.status).toBe(201);
    const saved = api.stored.get(res.body.key)!;
    expect(saved.parts).toBe(3); // 5 MiB, 5 MiB, 1234 bytes
    expect(saved.bytes.length).toBe(bytes.length);
    // Buffer.compare: a byte-by-byte toEqual on 10 MiB is too slow for a test.
    expect(Buffer.compare(Buffer.from(saved.bytes), Buffer.from(bytes))).toBe(0);
  });

  it("cancels the R2 multipart upload when a part fails, leaving nothing behind", async () => {
    api.multipart.failPart = 2;
    const res = await api.upload("collection=projects&owner=p", file(JPEG, 2 * PART_SIZE + 10), "big.jpg");
    expect(res.status).toBe(500);
    expect(api.multipart.aborted).toBe(1);
    expect(api.stored.size).toBe(0);
  });

  it("files under tracks, apply rounds (by _id) and pages", async () => {
    expect((await api.upload("collection=tracks&owner=t", file(PNG))).status).toBe(201);
    const round = (await api.post("/apply", roundBody())).body._id;
    const r = await api.upload(`collection=apply&owner=${round}`, file(PNG));
    expect(r.status).toBe(201);
    expect(r.body.key).toMatch(new RegExp(`^apply/${round}/`));
  });

  it.each([
    ["an unknown collection", "collection=finance&owner=p", 400],
    ["no owner", "collection=projects", 400],
    ["an owner that does not exist", "collection=projects&owner=nope", 400],
    ["an owner with unsafe characters", "collection=projects&owner=../x", 400],
    ["a bad round id", "collection=apply&owner=not-an-id", 400],
  ])("refuses %s", async (_label, query, status) => {
    expect((await api.upload(query, file(PNG))).status).toBe(status);
  });

  it.each([
    ["an empty file", () => api.upload("collection=projects&owner=p", new Uint8Array(0))],
    ["no file", () => api.upload("collection=projects&owner=p", null).field("x", "y")],
    ["a file in the wrong field", () => api.upload("collection=projects&owner=p", file(PNG), "a.png", "photo")],
    ["two files", () => api.upload("collection=projects&owner=p", file(PNG)).attach("file", Buffer.from(file(PNG)), "b.png")],
    ["a JSON body", () => api.upload("collection=projects&owner=p", null).send({ file: "x" })],
  ])("refuses %s with 400", async (_label, send) => {
    const res = await send();
    expect(res.status).toBe(400);
    expect(api.stored.size).toBe(0);
  });

  it("needs a token", async () => {
    const res = await request(db.app()).post("/api/admin/uploads?collection=projects&owner=p").attach("file", Buffer.from(file(PNG)), "a.png");
    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/admin/uploads/:key", () => {
  it("deletes a file nothing uses", async () => {
    const { key } = (await api.upload("collection=projects&owner=p", file(PNG))).body;
    expect((await api.delete(`/uploads/${key}`)).status).toBe(204);
    expect(api.stored.has(key)).toBe(false);
  });

  it("refuses (409) while a document still uses the file", async () => {
    const { key, url } = (await api.upload("collection=projects&owner=p", file(PNG))).body;
    await api.post("/projects/p/team", memberBody({ photo: url, is_photo_allowed: true }));
    const res = await api.delete(`/uploads/${key}`);
    expect(res.status).toBe(409);
    expect(api.stored.has(key)).toBe(true);
  });

  it.each([
    ["a file that is not there", "projects/p/0123456789abcdef0123456789abcdef.png"],
    ["a key with ..", "projects/../secret/0123456789abcdef0123456789abcdef.png"],
    ["a key outside the media folders", "finance/x/0123456789abcdef0123456789abcdef.png"],
  ])("answers 404 for %s", async (_label, key) => {
    expect((await api.delete(`/uploads/${key}`)).status).toBe(404);
  });

  it("an uploaded URL is accepted by the admin routes, and withdrawing consent deletes it", async () => {
    const { key, url } = (await api.upload("collection=projects&owner=p", file(PNG))).body;
    const member = (await api.post("/projects/p/team", memberBody({ photo: url, is_photo_allowed: true }))).body._id;
    await api.patch(`/projects/p/team/${member}`, { is_photo_allowed: false });
    expect(api.stored.has(key)).toBe(false);
  });
});

describe("cut-off uploads (review on PR #33)", () => {
  const BOUNDARY = "----tcos-test-boundary";
  /** A multipart body whose file part stops after `bytes`, with no closing boundary: the connection was cut. */
  const cutOff = (bytes: Uint8Array) =>
    Buffer.concat([
      Buffer.from(`--${BOUNDARY}\r\nContent-Disposition: form-data; name="file"; filename="a.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`),
      Buffer.from(bytes),
    ]);
  const TYPE = `multipart/form-data; boundary=${BOUNDARY}`;

  it("a small file cut off midway: 400, nothing stored", async () => {
    const res = await api.uploadRaw("collection=projects&owner=p", cutOff(file(JPEG, 1000)), TYPE);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cut off|interrupted/i);
    expect(api.stored.size).toBe(0);
  });

  it("a large file cut off after R2 parts were sent: 400, the multipart upload is aborted, nothing stored", async () => {
    const res = await api.uploadRaw("collection=projects&owner=p", cutOff(file(JPEG, PART_SIZE + PART_SIZE / 2)), TYPE);
    expect(res.status).toBe(400);
    expect(api.multipart.started).toBe(1);
    expect(api.multipart.aborted).toBe(1);
    expect(api.stored.size).toBe(0);
  });

  it("a file stream that errors midway: 400 and abort (streamToR2 directly)", async () => {
    const { Readable } = await import("node:stream");
    const { streamToR2 } = await import("../src/app/helpers/admin/upload.helper");
    let aborted = 0;
    const bucket = {
      createMultipartUpload: async () => ({
        uploadPart: async (n: number) => ({ partNumber: n, etag: "" }),
        complete: async () => {},
        abort: async () => void aborted++,
      }),
      put: async () => {},
    } as unknown as R2Bucket;
    const big = file(JPEG, PART_SIZE + 10);
    const broken = new Readable({
      read() {
        this.push(Buffer.from(big));
        this.destroy(new Error("connection reset"));
      },
    });
    await expect(streamToR2(bucket, "projects/p", broken, 50 * 1024 * 1024)).rejects.toMatchObject({ status: 400 });
    expect(aborted).toBe(1);
  });
});

describe("FILE_SIZE_LIMIT", () => {
  it("above the limit: 413, and a started multipart upload is aborted", async () => {
    const small = await adminClient(db, { FILE_SIZE_LIMIT: 6 });
    const res = await small.upload("collection=projects&owner=p", file(JPEG, 7 * 1024 * 1024), "big.jpg");
    expect(res.status).toBe(413);
    expect(res.body.error).toMatch(/limit 6 MB/);
    expect(small.multipart.aborted).toBe(1);
    expect(small.stored.size).toBe(0);
  });

  it("at the limit is fine", async () => {
    const small = await adminClient(db, { FILE_SIZE_LIMIT: 1 });
    expect((await small.upload("collection=projects&owner=p", file(JPEG, 1024 * 1024), "a.jpg")).status).toBe(201);
  });

  it("defaults to 50 MB and must be a whole number of MB up to 100", async () => {
    const { initConfig } = await import("../src/app/config/init");
    const { testConfig } = await import("./helpers/app");
    const { FILE_SIZE_LIMIT, ...env } = testConfig();
    expect(initConfig(env).FILE_SIZE_LIMIT).toBe(50);
    expect(initConfig({ ...env, FILE_SIZE_LIMIT: "20" }).FILE_SIZE_LIMIT).toBe(20);
    for (const bad of ["0", "-5", "1.5", "lots", "500"]) expect(() => initConfig({ ...env, FILE_SIZE_LIMIT: bad })).toThrow(/FILE_SIZE_LIMIT/);
  });
});
