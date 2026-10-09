"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { safeRedirectPath } from "@/lib/safe-redirect";
import type { CreatorSummary } from "@/types";
import type { LoginInput, RegisterInput } from "@/lib/schemas";
import { authApi } from "../api";

function useEnterStudio() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return (creator: CreatorSummary, next?: string | null) => {
    queryClient.clear();
    queryClient.setQueryData(queryKeys.me, creator);
    router.replace(safeRedirectPath(next));
    router.refresh();
  };
}

export function useSignIn(next: string | null) {
  const enterStudio = useEnterStudio();
  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (creator) => enterStudio(creator, next),
  });
}

export function useRegister() {
  const enterStudio = useEnterStudio();
  return useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
    onSuccess: (creator) => enterStudio(creator, "/"),
  });
}

export function useLeaveStudio() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const leave = () => {
    queryClient.clear();
    router.replace("/login");
    router.refresh();
  };
  return {
    signOut: useMutation({ mutationFn: authApi.logout, onSuccess: leave }),
    resetDemo: useMutation({ mutationFn: authApi.resetDemo, onSuccess: leave }),
  };
}
