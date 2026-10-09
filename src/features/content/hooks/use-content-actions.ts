"use client";

import { useState } from "react";
import { toast } from "sonner";
import { errorMessage, isApiError } from "@/lib/api-client";
import type { ContentItem } from "@/types";
import { useDeleteContent, usePublishContent } from "./use-content-mutations";

export function useContentActions({ onDeleteConfirmed }: { onDeleteConfirmed?: () => void } = {}) {
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ContentItem | null>(null);
  const publish = usePublishContent();
  const remove = useDeleteContent();

  return {
    publish: (item: ContentItem) =>
      publish.mutate(item, {
        onSuccess: (saved) => toast.success(`“${saved.title}” is live`),
        onError: (error) => {
          if (isApiError(error) && error.code === "NOT_VERIFIED") setBlockedMessage(error.message);
          else toast.error(errorMessage(error));
        },
      }),
    publishingId: publish.isPending ? publish.variables?.id : undefined,
    blockedMessage,
    dismissBlocked: () => setBlockedMessage(null),

    pendingDelete,
    requestDelete: setPendingDelete,
    cancelDelete: () => setPendingDelete(null),
    confirmDelete: () => {
      if (!pendingDelete) return;
      setPendingDelete(null);
      onDeleteConfirmed?.();
      remove.mutate(pendingDelete);
    },
    deleting: remove.isPending,
  };
}

export type ContentActions = ReturnType<typeof useContentActions>;
