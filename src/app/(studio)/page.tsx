import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { VerificationBanner } from "@/components/layout/VerificationBanner";
import { ContentLibrary } from "@/features/content/components/ContentLibrary";
import { DashboardGreeting } from "@/features/dashboard/components/DashboardGreeting";
import { OverviewStats } from "@/features/dashboard/components/OverviewStats";
import { PerformanceChart } from "@/features/dashboard/components/PerformanceChart";
import { PurchasesPanel } from "@/features/purchases/components/PurchasesPanel";
import { INITIAL_PURCHASE_FILTERS } from "@/features/purchases/queries";
import { releaseDueScheduledContent } from "@/server/content";
import { prefetch, serverQueries } from "@/server/prefetch";
import { requireCreator } from "@/server/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const creator = await requireCreator();
  await releaseDueScheduledContent(creator);
  const queryClient = await prefetch(
    serverQueries.overview(creator),
    serverQueries.daily(creator),
    serverQueries.contentList(creator),
    serverQueries.purchases(creator, INITIAL_PURCHASE_FILTERS),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex flex-col gap-6 lg:gap-8">
        <DashboardGreeting
          actions={
            <ButtonLink href="/content/new" className="max-sm:hidden">
              <Plus className="size-4" aria-hidden="true" />
              Upload video
            </ButtonLink>
          }
        />
        <VerificationBanner />
        <OverviewStats />
        <PerformanceChart />
        <ContentLibrary />
        <PurchasesPanel />
      </div>
    </HydrationBoundary>
  );
}
