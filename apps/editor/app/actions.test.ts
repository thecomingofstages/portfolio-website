import { beforeEach, describe, expect, it, vi } from "vitest";

const MEDIA = "https://media.example.org";
const admin = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_MEDIA_BASE_URL = "https://media.example.org";
  return {
    getPage: vi.fn(),
    savePageBlocks: vi.fn(),
    getProject: vi.fn(),
    updateProject: vi.fn(),
    deleteUnusedMedia: vi.fn(),
  };
});
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ refresh: () => {} }));
vi.mock("next/navigation", () => ({ redirect: () => {} }));
vi.mock("@/lib/admin-api", async (original) => ({ ...(await original<object>()), ...admin }));

const { saveBlocks, saveProjectFields } = await import("./actions");
const { PROJECT_STATUSES, PROJECT_TYPES } = await import("@/lib/schemas");

const article = (image: string | null) => ({ id: "about", type: "article", is_shown: true, body: "", image, image_side: null });

describe("files a save removes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes a picture the blocks no longer use, and only that one", async () => {
    const kept = `${MEDIA}/pages/home/a.jpg`;
    const dropped = `${MEDIA}/pages/home/b.jpg`;
    admin.getPage.mockResolvedValue({ blocks: [article(kept), { ...article(dropped), id: "two" }] });
    expect((await saveBlocks({ kind: "page", key: "home" }, [article(kept)])).ok).toBe(true);
    expect(admin.deleteUnusedMedia).toHaveBeenCalledWith([dropped]);
  });

  it("never offers team photos when a project's own fields are saved", async () => {
    const photo = `${MEDIA}/projects/p/photo.jpg`;
    const pic = `${MEDIA}/projects/p/pic.jpg`;
    admin.getProject.mockResolvedValue({ slug: "p", pics: [pic], org_chart_image: null, team: [{ photo }] });
    const fields = {
      slug: "p",
      name: "<...>",
      type: PROJECT_TYPES[0],
      status: PROJECT_STATUSES[0],
      start_date: "2026-01-01",
      end_date: null,
      venue: null,
      summary: "",
      pics: [],
      org_chart_image: null,
      is_yearbook_shown: false,
      is_shown: false,
    };
    expect((await saveProjectFields("p", fields)).ok).toBe(true);
    expect(admin.updateProject).toHaveBeenCalled();
    expect(admin.deleteUnusedMedia).toHaveBeenCalledWith([pic]);
  });

  it("deletes nothing when the save fails", async () => {
    admin.getPage.mockResolvedValue({ blocks: [article(`${MEDIA}/pages/home/a.jpg`)] });
    const { AdminApiError } = await import("@/lib/admin-api");
    admin.savePageBlocks.mockRejectedValueOnce(new AdminApiError(400, "bad"));
    expect((await saveBlocks({ kind: "page", key: "home" }, [])).ok).toBe(false);
    expect(admin.deleteUnusedMedia).not.toHaveBeenCalled();
  });
});
