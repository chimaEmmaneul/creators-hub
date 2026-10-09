import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { prefetch, serverQueries } from "@/server/prefetch";
import { requireCreator } from "@/server/session";

export default async function StudioLayout({ children }: { children: ReactNode }) {
  const creator = await requireCreator();
  const queryClient = await prefetch(serverQueries.me(creator));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AppShell>{children}</AppShell>
    </HydrationBoundary>
  );
}
