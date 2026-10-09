"use client";

import { useQuery } from "@tanstack/react-query";
import { QueryView } from "@/components/ui/QueryView";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";
import { contentQueries } from "../../queries";
import { ContentForm } from "./ContentForm";

export function EditContentForm({ id }: { id: string }) {
  const query = useQuery(contentQueries.detail(id));
  return (
    <QueryView
      query={query}
      errorTitle="We couldn't load this video"
      skeleton={
        <LoadingRegion label="Loading video">
          <Skeleton className="h-96 rounded-xl" />
        </LoadingRegion>
      }
    >
      {(item) => <ContentForm item={item} />}
    </QueryView>
  );
}
