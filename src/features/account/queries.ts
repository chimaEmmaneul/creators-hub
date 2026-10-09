import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { queryKeys } from "@/lib/query/keys";
import type { CreatorSummary } from "@/types";

export const meQuery = () =>
  queryOptions({
    queryKey: queryKeys.me,
    queryFn: ({ signal }) => apiRequest<CreatorSummary>("/api/me", { signal }),
  });

export function useCurrentCreator() {
  return useQuery(meQuery());
}
