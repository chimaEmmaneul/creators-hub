import type { PurchaseFilters } from "@/lib/query/keys";
import { queryKeys } from "@/lib/query/keys";
import { purchaseQuerySchema } from "@/lib/schemas";
import type { CreatorSummary } from "@/types";
import { getDailyMetrics, getDashboardOverview } from "./analytics";
import { getContent, listContent } from "./content";
import { listPurchases } from "./purchases";
import { getServerQueryClient } from "./query-client";
import { getVerificationState } from "./verification";

type Actor = CreatorSummary;

export const serverQueries = {
  me: (creator: Actor) => ({ queryKey: queryKeys.me, queryFn: () => creator }),
  overview: (creator: Actor) => ({ queryKey: queryKeys.dashboard.overview, queryFn: () => getDashboardOverview(creator.id) }),
  daily: (creator: Actor) => ({ queryKey: queryKeys.dashboard.daily, queryFn: () => getDailyMetrics(creator.id) }),
  contentList: (creator: Actor) => ({ queryKey: queryKeys.content.list, queryFn: () => listContent(creator) }),
  contentDetail: (creator: Actor, id: string) => ({ queryKey: queryKeys.content.detail(id), queryFn: () => getContent(creator, id) }),
  purchases: (creator: Actor, filters: PurchaseFilters) => ({
    queryKey: queryKeys.purchases.list(filters),
    queryFn: () => listPurchases(creator.id, purchaseQuerySchema.parse(filters)),
  }),
  verification: (creator: Actor) => ({ queryKey: queryKeys.verification, queryFn: () => getVerificationState(creator.id) }),
};

export async function prefetch(...queries: { queryKey: readonly unknown[]; queryFn: () => unknown }[]) {
  const queryClient = getServerQueryClient();
  await Promise.all(queries.map((query) => queryClient.prefetchQuery(query)));
  return queryClient;
}
