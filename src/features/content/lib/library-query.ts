import type { ContentItem, ContentStatus } from "@/types";

export const LIBRARY_PAGE_SIZE = 6;

export const LIBRARY_SORTS = {
  newest: { label: "Newest first", compare: (a: ContentItem, b: ContentItem) => b.createdAt.localeCompare(a.createdAt) },
  revenue: { label: "Most revenue", compare: (a: ContentItem, b: ContentItem) => b.revenueCents - a.revenueCents },
  views: { label: "Most views", compare: (a: ContentItem, b: ContentItem) => b.views - a.views },
  title: { label: "Title A–Z", compare: (a: ContentItem, b: ContentItem) => a.title.localeCompare(b.title) },
} as const;

export type LibrarySort = keyof typeof LIBRARY_SORTS;
export type StatusFilter = ContentStatus | "ALL";

export interface LibraryQuery {
  search: string;
  status: StatusFilter;
  sort: LibrarySort;
  page: number;
}

export const INITIAL_LIBRARY_QUERY: LibraryQuery = { search: "", status: "ALL", sort: "newest", page: 1 };

export function queryLibrary(items: ContentItem[], query: LibraryQuery) {
  const needle = query.search.trim().toLowerCase();
  const matches = items
    .filter((item) => query.status === "ALL" || item.status === query.status)
    .filter((item) => !needle || item.title.toLowerCase().includes(needle))
    .sort(LIBRARY_SORTS[query.sort].compare);

  const totalPages = Math.max(1, Math.ceil(matches.length / LIBRARY_PAGE_SIZE));
  const page = Math.min(query.page, totalPages);

  return {
    pageItems: matches.slice((page - 1) * LIBRARY_PAGE_SIZE, page * LIBRARY_PAGE_SIZE),
    totalItems: matches.length,
    totalPages,
    page,
  };
}

export function countByStatus(items: ContentItem[]): Record<StatusFilter, number> {
  const counts: Record<StatusFilter, number> = { ALL: items.length, PUBLISHED: 0, SCHEDULED: 0, DRAFT: 0 };
  for (const item of items) counts[item.status] += 1;
  return counts;
}
