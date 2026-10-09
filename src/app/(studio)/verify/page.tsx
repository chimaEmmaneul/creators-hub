import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/PageHeader";
import { VerificationFlow } from "@/features/verification/components/VerificationFlow";
import { prefetch, serverQueries } from "@/server/prefetch";
import { requireCreator } from "@/server/session";

export const metadata: Metadata = { title: "Verification" };

export default async function VerifyPage() {
  const creator = await requireCreator();
  const queryClient = await prefetch(serverQueries.verification(creator));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <PageHeader title="Verify your identity" description="Required once, before you can publish paid content." />
        <VerificationFlow />
      </div>
    </HydrationBoundary>
  );
}
