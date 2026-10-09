import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { queryKeys } from "@/lib/query/keys";
import type { DailyMetric, DashboardOverview } from "@/types";

export const dashboardQueries = {
  overview: () =>
    queryOptions({
      queryKey: queryKeys.dashboard.overview,
      queryFn: ({ signal }) => apiRequest<DashboardOverview>("/api/dashboard/overview", { signal }),
    }),
  daily: () =>
    queryOptions({
      queryKey: queryKeys.dashboard.daily,
      queryFn: ({ signal }) => apiRequest<DailyMetric[]>("/api/dashboard/daily", { signal }),
    }),
};
