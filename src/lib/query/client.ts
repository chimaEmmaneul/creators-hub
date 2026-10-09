import { QueryClient, isServer } from "@tanstack/react-query";
import { isApiError } from "@/lib/api-client";

const MAX_AUTOMATIC_RETRIES = 2;

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        retry: (failureCount, error) => failureCount < MAX_AUTOMATIC_RETRIES && isApiError(error) && error.isRetryable,
      },
      mutations: { retry: false },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
