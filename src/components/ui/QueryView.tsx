"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ErrorState } from "./ErrorState";

interface QueryViewProps<Data> {
  query: UseQueryResult<Data>;
  skeleton: ReactNode;
  errorTitle: string;
  children: (data: Data) => ReactNode;
}

export function QueryView<Data>({ query, skeleton, errorTitle, children }: QueryViewProps<Data>) {
  if (query.data !== undefined) return <>{children(query.data)}</>;
  if (query.isError) {
    return <ErrorState title={errorTitle} error={query.error} onRetry={() => query.refetch()} retrying={query.isFetching} />;
  }
  return <>{skeleton}</>;
}
