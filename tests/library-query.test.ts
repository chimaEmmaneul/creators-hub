import { describe, expect, it } from "vitest";
import { INITIAL_LIBRARY_QUERY, LIBRARY_PAGE_SIZE, countByStatus, queryLibrary } from "@/features/content/lib/library-query";
import type { ContentItem, ContentStatus } from "@/types";

function item(overrides: Partial<ContentItem> & { id: string }): ContentItem {
  return {
    title: `Video ${overrides.id}`,
    description: "",
    priceCents: 999,
    thumbnailUrl: null,
    videoFileName: "v.mp4",
    videoSizeBytes: 1,
    videoUrl: null,
    videoCredit: null,
    videoCreditUrl: null,
    status: "PUBLISHED" as ContentStatus,
    scheduledAt: null,
    publishedAt: null,
    views: 0,
    purchaseCount: 0,
    revenueCents: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const items = [
  item({ id: "a", title: "Color grading basics", status: "PUBLISHED", revenueCents: 500 }),
  item({ id: "b", title: "Lighting setup", status: "DRAFT", revenueCents: 0 }),
  item({ id: "c", title: "Advanced color", status: "SCHEDULED", revenueCents: 900 }),
];

describe("queryLibrary", () => {
  it("filters by status and case-insensitive title search", () => {
    const result = queryLibrary(items, { ...INITIAL_LIBRARY_QUERY, search: "COLOR", status: "PUBLISHED" });
    expect(result.pageItems.map((i) => i.id)).toEqual(["a"]);
  });

  it("sorts by revenue", () => {
    const result = queryLibrary(items, { ...INITIAL_LIBRARY_QUERY, sort: "revenue" });
    expect(result.pageItems.map((i) => i.id)).toEqual(["c", "a", "b"]);
  });

  it("clamps the page when results shrink", () => {
    const many = Array.from({ length: LIBRARY_PAGE_SIZE + 1 }, (_, n) => item({ id: String(n) }));
    const result = queryLibrary(many.slice(0, 2), { ...INITIAL_LIBRARY_QUERY, page: 2 });
    expect(result.page).toBe(1);
    expect(result.pageItems).toHaveLength(2);
  });

  it("counts items per status", () => {
    expect(countByStatus(items)).toEqual({ ALL: 3, PUBLISHED: 1, DRAFT: 1, SCHEDULED: 1 });
  });
});
