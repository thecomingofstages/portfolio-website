import { afterEach, describe, expect, it, vi } from "vitest";

const load = async (base: string) => {
  vi.stubEnv("NEXT_PUBLIC_MEDIA_BASE_URL", base);
  vi.resetModules();
  return (await import("./media")).isMediaUrl;
};

describe("isMediaUrl", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("takes only media bucket URLs", async () => {
    const isMediaUrl = await load("https://media.example.org/");
    expect(isMediaUrl("https://media.example.org/pages/home/a.jpg")).toBe(true);
    expect(isMediaUrl("https://other.example.org/a.jpg")).toBe(false);
    expect(isMediaUrl("https://media.example.org.evil.test/a.jpg")).toBe(false);
    expect(isMediaUrl("<...>")).toBe(false);
  });

  it("refuses every URL without the setting, as the site does", async () => {
    const isMediaUrl = await load("");
    expect(isMediaUrl("https://media.example.org/a.jpg")).toBe(false);
  });
});

describe("driveFileId", () => {
  it("reads the id of a Drive share link", async () => {
    const { driveFileId } = await import("./media");
    const id = "1AbCdEfGhIjKlMnOpQrStUv";
    expect(driveFileId(`https://drive.google.com/file/d/${id}/view?usp=sharing`)).toBe(id);
    expect(driveFileId(`https://drive.google.com/open?id=${id}`)).toBe(id);
    expect(driveFileId(`https://drive.google.com/uc?id=${id}&export=download`)).toBe(id);
  });

  it("refuses anything else", async () => {
    const { driveFileId } = await import("./media");
    for (const url of ["https://example.com/file/d/1AbCdEfGhIjKlMn/view", "http://drive.google.com/open?id=1AbCdEfGhIjKlMn", "drive", "https://drive.google.com/drive/folders/x"]) {
      expect(driveFileId(url)).toBeNull();
    }
  });
});

describe("mediaUrlsIn", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("finds every bucket URL in a document, once", async () => {
    vi.stubEnv("NEXT_PUBLIC_MEDIA_BASE_URL", "https://media.example.org");
    vi.resetModules();
    const { mediaUrlsIn, mediaKey } = await import("./media");
    const a = "https://media.example.org/pages/home/a.jpg";
    const b = "https://media.example.org/pages/home/b.mp4";
    expect(mediaUrlsIn([{ media_url: a, slides: [b, a] }, { url: "https://other.example/c.jpg" }, 3, null])).toEqual([a, b]);
    expect(mediaKey(b)).toBe("pages/home/b.mp4");
  });
});
