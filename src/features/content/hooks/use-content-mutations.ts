"use client";

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { errorMessage } from "@/lib/api-client";
import { queryKeys } from "@/lib/query/keys";
import type { CreateContentInput, UpdateContentInput } from "@/lib/schemas";
import type { ContentItem, CreatorSummary } from "@/types";
import { contentApi } from "../api";

type Snapshot = { list?: ContentItem[]; detail?: ContentItem };

async function snapshot(queryClient: QueryClient, id: string): Promise<Snapshot> {
  await queryClient.cancelQueries({ queryKey: queryKeys.content.all });
  return {
    list: queryClient.getQueryData<ContentItem[]>(queryKeys.content.list),
    detail: queryClient.getQueryData<ContentItem>(queryKeys.content.detail(id)),
  };
}

function restore(queryClient: QueryClient, id: string, previous?: Snapshot) {
  if (!previous) return;
  queryClient.setQueryData(queryKeys.content.list, previous.list);
  queryClient.setQueryData(queryKeys.content.detail(id), previous.detail);
}

function storeItem(queryClient: QueryClient, item: ContentItem) {
  queryClient.setQueryData(queryKeys.content.detail(item.id), item);
  queryClient.setQueryData<ContentItem[]>(queryKeys.content.list, (list) =>
    list?.some((existing) => existing.id === item.id) ? list.map((existing) => (existing.id === item.id ? item : existing)) : list,
  );
}

function invalidateAfterWrite(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.content.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
  ]);
}

export function usePublishContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: ContentItem) => contentApi.publish(item.id),
    onMutate: async (item) => {
      const previous = await snapshot(queryClient, item.id);
      const verified = queryClient.getQueryData<CreatorSummary>(queryKeys.me)?.verificationStatus === "VERIFIED";
      if (verified) {
        storeItem(queryClient, { ...item, status: "PUBLISHED", scheduledAt: null, publishedAt: new Date().toISOString() });
      }
      return previous;
    },
    onError: (_error, item, previous) => restore(queryClient, item.id, previous),
    onSuccess: (saved) => storeItem(queryClient, saved),
    onSettled: () => invalidateAfterWrite(queryClient),
  });
}

export function useDeleteContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: ContentItem) => contentApi.remove(item.id),
    onMutate: async (item) => {
      const previous = await snapshot(queryClient, item.id);
      queryClient.setQueryData<ContentItem[]>(queryKeys.content.list, (list) => list?.filter((existing) => existing.id !== item.id));
      return previous;
    },
    onError: (error, item, previous) => {
      restore(queryClient, item.id, previous);
      toast.error(`Couldn't delete “${item.title}”. ${errorMessage(error)}`);
    },
    onSuccess: (_result, item) => {
      queryClient.removeQueries({ queryKey: queryKeys.content.detail(item.id) });
      toast.success(`“${item.title}” was deleted`);
    },
    onSettled: () => invalidateAfterWrite(queryClient),
  });
}

export function useSaveContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (save: () => Promise<ContentItem>) => save(),
    onSuccess: (saved) => storeItem(queryClient, saved),
    onSettled: () => invalidateAfterWrite(queryClient),
  });
}

export const saveCalls = {
  create: (input: CreateContentInput) => () => contentApi.create(input),
  update: (id: string, input: UpdateContentInput) => () => contentApi.update(id, input),
};
