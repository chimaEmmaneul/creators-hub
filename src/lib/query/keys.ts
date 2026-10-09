import type { PurchaseQuery } from "@/lib/schemas";

export type PurchaseFilters = Pick<PurchaseQuery, "status" | "sort" | "order" | "page">;

export const queryKeys = {
  me: ["me"] as const,
  dashboard: {
    all: ["dashboard"] as const,
    overview: ["dashboard", "overview"] as const,
    daily: ["dashboard", "daily"] as const,
  },
  content: {
    all: ["content"] as const,
    list: ["content", "list"] as const,
    detail: (id: string) => ["content", "detail", id] as const,
  },
  purchases: {
    all: ["purchases"] as const,
    list: ({ status, ...rest }: PurchaseFilters) => ["purchases", "list", status ? { ...rest, status } : rest] as const,
  },
  verification: ["verification"] as const,
};
