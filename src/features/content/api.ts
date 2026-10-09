import { apiRequest } from "@/lib/api-client";
import type { CreateContentInput, UpdateContentInput } from "@/lib/schemas";
import type { ContentItem } from "@/types";

type ItemResponse = { item: ContentItem };

export const contentApi = {
  list: (signal?: AbortSignal) =>
    apiRequest<{ items: ContentItem[] }>("/api/content", { signal }).then((r) => r.items),

  get: (id: string, signal?: AbortSignal) =>
    apiRequest<ItemResponse>(`/api/content/${id}`, { signal }).then((r) => r.item),

  create: (input: CreateContentInput) =>
    apiRequest<ItemResponse>("/api/content", { method: "POST", body: input }).then((r) => r.item),

  update: (id: string, input: UpdateContentInput) =>
    apiRequest<ItemResponse>(`/api/content/${id}`, { method: "PATCH", body: input }).then((r) => r.item),

  publish: (id: string) =>
    apiRequest<ItemResponse>(`/api/content/${id}/publish`, { method: "POST" }).then((r) => r.item),

  remove: (id: string) => apiRequest<void>(`/api/content/${id}`, { method: "DELETE" }),
};
