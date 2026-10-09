import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { queryKeys, type PurchaseFilters } from "@/lib/query/keys";
import type { Paginated, PurchaseItem } from "@/types";

export const INITIAL_PURCHASE_FILTERS: PurchaseFilters = { sort: "createdAt", order: "desc", page: 1 };

export const purchaseQueries = {
  list: (filters: PurchaseFilters) =>
    queryOptions({
      queryKey: queryKeys.purchases.list(filters),
      queryFn: ({ signal }) => {
        const params = new URLSearchParams({ sort: filters.sort, order: filters.order, page: String(filters.page) });
        if (filters.status) params.set("status", filters.status);
        return apiRequest<Paginated<PurchaseItem>>(`/api/purchases?${params}`, { signal });
      },
      placeholderData: keepPreviousData,
    }),
};
