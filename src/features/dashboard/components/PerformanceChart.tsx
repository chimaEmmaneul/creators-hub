"use client";

import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3 } from "lucide-react";
import { formatCurrency, formatDayKey, formatInteger } from "@/lib/format";
import type { DailyMetric } from "@/types";
import { SectionCard } from "@/components/ui/Card";
import { SegmentedControl, type SegmentOption } from "@/components/ui/SegmentedControl";
import { EmptyState } from "@/components/ui/StatePanels";
import { QueryView } from "@/components/ui/QueryView";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";
import { dashboardQueries } from "../queries";

type Metric = "revenue" | "purchases";

const METRICS: Record<Metric, { label: string; read: (d: DailyMetric) => number; format: (n: number) => string; axis: (n: number) => string }> = {
  revenue: {
    label: "Revenue",
    read: (d) => d.revenueCents / 100,
    format: (dollars) => formatCurrency(dollars * 100),
    axis: (dollars) => `$${formatInteger(dollars)}`,
  },
  purchases: {
    label: "Purchases",
    read: (d) => d.purchases,
    format: (n) => formatInteger(n),
    axis: (n) => formatInteger(n),
  },
};

const METRIC_OPTIONS: SegmentOption<Metric>[] = [
  { value: "revenue", label: "Revenue" },
  { value: "purchases", label: "Purchases" },
];

const AXIS_TICK = { fontSize: 12, fill: "var(--color-muted)" };

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  value?: unknown;
  metric: Metric;
}

function ChartTooltip({ active, label, value, metric }: ChartTooltipProps) {
  if (!active || value === undefined) return null;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-sm shadow-pop">
      <p className="text-xs text-muted">{formatDayKey(String(label))}</p>
      <p className="mt-0.5 flex items-center gap-2 font-semibold text-fg tabular-nums">
        <span className="size-2 rounded-full bg-chart" aria-hidden="true" />
        {METRICS[metric].format(Number(value))}
      </p>
    </div>
  );
}

export function PerformanceChart() {
  const query = useQuery(dashboardQueries.daily());
  const [metric, setMetric] = useState<Metric>("revenue");
  const config = METRICS[metric];
  const points = (query.data ?? []).map((d) => ({ date: d.date, value: config.read(d) }));
  const total = points.reduce((sum, point) => sum + point.value, 0);
  const hasData = total > 0;

  return (
    <SectionCard
      titleId="performance-heading"
      title="Performance"
      description={
        hasData ? (
          <>
            <span className="font-semibold text-fg tabular-nums">{config.format(total)}</span> {config.label.toLowerCase()} in the last 30 days
          </>
        ) : (
          "Last 30 days"
        )
      }
      actions={<SegmentedControl legend="Chart metric" options={METRIC_OPTIONS} value={metric} onChange={setMetric} />}
    >
      <QueryView
        query={query}
        errorTitle="We couldn't load your chart"
        skeleton={
          <LoadingRegion label="Loading chart" className="p-4">
            <Skeleton className="h-64 sm:h-72" />
          </LoadingRegion>
        }
      >
        {() =>
          hasData ? (
            <ChartBody points={points} metric={metric} />
          ) : (
            <EmptyState
              icon={BarChart3}
              title="No sales in the last 30 days"
              description="When viewers buy your videos, daily revenue and purchases will appear here."
            />
          )
        }
      </QueryView>
    </SectionCard>
  );
}

function ChartBody({ points, metric }: { points: { date: string; value: number }[]; metric: Metric }) {
  const gradientId = useId();
  const config = METRICS[metric];
  return (
    <figure className="px-2 pt-4 pb-2 sm:px-4">
      <figcaption className="sr-only">
        Daily {config.label.toLowerCase()} for the last 30 days. Expand the data table below for exact values.
      </figcaption>
      <div className="h-64 sm:h-72" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart)" stopOpacity={0.18} />
                <stop offset="100%" stopColor="var(--color-chart)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--color-line)" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDayKey}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={28}
              tickMargin={8}
            />
            <YAxis tickFormatter={config.axis} tick={AXIS_TICK} tickLine={false} axisLine={false} width={56} allowDecimals={false} />
            <Tooltip
              content={({ active, label, payload }) => <ChartTooltip active={active} label={label} value={payload?.[0]?.value} metric={metric} />}
              cursor={{ stroke: "var(--color-line-strong)", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--color-chart)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={`url(#${gradientId})`}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--color-surface)", fill: "var(--color-chart)" }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <DataTable points={points} metric={metric} />
    </figure>
  );
}

function DataTable({ points, metric }: { points: { date: string; value: number }[]; metric: Metric }) {
  const config = METRICS[metric];
  return (
    <details className="group mx-2 mt-2 rounded-lg text-sm sm:mx-1">
      <summary className="inline-flex min-h-11 cursor-pointer items-center rounded-md px-2 text-muted hover:text-fg sm:min-h-8">
        View as table
      </summary>
      <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-line">
        <table className="w-full text-left">
          <caption className="sr-only">Daily {config.label.toLowerCase()}</caption>
          <thead className="sticky top-0 bg-subtle text-xs text-muted">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Date</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">{config.label}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {points.map((point) => (
              <tr key={point.date}>
                <th scope="row" className="px-3 py-1.5 font-normal text-muted">{formatDayKey(point.date)}</th>
                <td className="px-3 py-1.5 text-right text-fg tabular-nums">{config.format(point.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
