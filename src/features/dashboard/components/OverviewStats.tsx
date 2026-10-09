"use client";

import { useQuery } from "@tanstack/react-query";
import { clsx } from "clsx";
import { DollarSign, Film, ShoppingBag, TrendingDown, TrendingUp, Wallet, type LucideIcon } from "lucide-react";
import { formatCompactNumber, formatCurrency, formatInteger, formatPercentChange } from "@/lib/format";
import type { DashboardOverview } from "@/types";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";
import { QueryView } from "@/components/ui/QueryView";
import { dashboardQueries } from "../queries";

interface StatTileProps {
  label: string;
  value: string;
  icon: LucideIcon;
  footnote: React.ReactNode;
  emphasis?: boolean;
  className?: string;
}

function StatTile({ label, value, icon: Icon, footnote, emphasis, className }: StatTileProps) {
  return (
    <div
      className={clsx(
        "flex flex-col gap-3 rounded-xl border p-4 shadow-card sm:p-5",
        emphasis ? "border-transparent bg-accent text-on-accent" : "border-line bg-surface",
        className,
      )}
    >
      <dt className={clsx("flex items-center justify-between gap-2 text-sm font-medium", emphasis ? "text-on-accent/85" : "text-muted")}>
        {label}
        <Icon className="size-4.5 opacity-80" aria-hidden="true" />
      </dt>
      <dd className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{value}</dd>
      <dd className={clsx("text-xs", emphasis ? "text-on-accent/80" : "text-muted")}>{footnote}</dd>
    </div>
  );
}

function MonthTrend({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return <>No sales last month to compare</>;
  const change = (current - previous) / previous;
  const up = change >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className={clsx("size-3.5", up ? "text-success" : "text-danger")} aria-hidden="true" />
      <span className={clsx("font-medium", up ? "text-success" : "text-danger")}>{formatPercentChange(change)}</span>
      vs. last month ({formatCurrency(previous)})
    </span>
  );
}

export function OverviewStats() {
  const query = useQuery(dashboardQueries.overview());
  return (
    <QueryView query={query} errorTitle="We couldn't load your totals" skeleton={<OverviewSkeleton />}>
      {(overview) => <StatGrid overview={overview} />}
    </QueryView>
  );
}

export function OverviewSkeleton() {
  return (
    <LoadingRegion label="Loading totals" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className={i < 2 ? "col-span-2 h-32 rounded-xl sm:col-span-1" : "h-32 rounded-xl"} />
      ))}
    </LoadingRegion>
  );
}

function StatGrid({ overview }: { overview: DashboardOverview }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <StatTile
        emphasis
        className="col-span-2 sm:col-span-1"
        label="Total revenue"
        value={formatCurrency(overview.totalRevenueCents)}
        icon={Wallet}
        footnote="From completed purchases, all time"
      />
      <StatTile
        className="col-span-2 sm:col-span-1"
        label="Revenue this month"
        value={formatCurrency(overview.revenueThisMonthCents)}
        icon={DollarSign}
        footnote={<MonthTrend current={overview.revenueThisMonthCents} previous={overview.revenueLastMonthCents} />}
      />
      <StatTile label="Total content" value={formatInteger(overview.contentCount)} icon={Film} footnote={`${overview.publishedCount} published`} />
      <StatTile label="Total purchases" value={formatCompactNumber(overview.purchaseCount)} icon={ShoppingBag} footnote="Completed purchases" />
    </dl>
  );
}
