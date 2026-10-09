"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import type { VerificationStepInput } from "@/lib/schemas";
import { verificationApi } from "../api";
import { verificationQuery } from "../queries";

export function useVerification() {
  const queryClient = useQueryClient();
  const query = useQuery(verificationQuery());

  const submitStep = useMutation({
    mutationFn: (input: VerificationStepInput) => verificationApi.submitStep(input),
    onSuccess: (state) => queryClient.setQueryData(queryKeys.verification, state),
  });

  const status = query.data?.status;
  const previousStatus = useRef(status);
  useEffect(() => {
    if (status && previousStatus.current && previousStatus.current !== status) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.me });
    }
    previousStatus.current = status;
  }, [status, queryClient]);

  return { query, submitStep };
}
