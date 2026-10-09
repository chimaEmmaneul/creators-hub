import { queryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { contentApi } from "./api";

export const contentQueries = {
  list: () => queryOptions({ queryKey: queryKeys.content.list, queryFn: ({ signal }) => contentApi.list(signal) }),
  detail: (id: string) =>
    queryOptions({ queryKey: queryKeys.content.detail(id), queryFn: ({ signal }) => contentApi.get(id, signal) }),
};
