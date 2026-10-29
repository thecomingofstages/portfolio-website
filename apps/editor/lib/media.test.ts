import { afterEach, describe, expect, it, vi } from "vitest";

const load = async (base: string) => {
  vi.stubEnv("NEXT_PUBLIC_MEDIA_BASE_URL", base);
  vi.resetModules();
  return (await import("./media")).isAllowedImage;
};

describe("isAllowedImage", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("takes only media bucket URLs among absolute ones", async () => {
    const isAllowedImage = await load("https://media.example.org/");
    expect(isAllowedImage("https://media.example.org/pages/home/a.jpg")).toBe(true);
    expect(isAllowedImage("https://other.example.org/a.jpg")).toBe(false);
    expect(isAllowedImage("https://media.example.org.evil.test/a.jpg")).toBe(false);
  });

  it("takes what the site never loads from elsewhere: empty, site paths, placeholders", async () => {
    const isAllowedImage = await load("https://media.example.org");
    for (const url of ["", "/logo.png", "<...>"]) expect(isAllowedImage(url)).toBe(true);
  });

  it("refuses every absolute URL without the setting, as the site does", async () => {
    const isAllowedImage = await load("");
    expect(isAllowedImage("https://media.example.org/a.jpg")).toBe(false);
  });
});
