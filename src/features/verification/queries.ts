import { queryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { verificationApi } from "./api";

const REVIEW_POLL_MS = 2_000;

export const verificationQuery = () =>
  queryOptions({
    queryKey: queryKeys.verification,
    queryFn: ({ signal }) => verificationApi.get(signal),
    refetchInterval: (query) => (query.state.data?.status === "PENDING" ? REVIEW_POLL_MS : false),
  });
