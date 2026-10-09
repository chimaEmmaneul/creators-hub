"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { clsx } from "clsx";
import { Receipt } from "lucide-react";
import { countryFlag, formatCountry, formatCurrency, formatDate } from "@/lib/format";
import type { PurchaseFilters } from "@/lib/query/keys";
import { PURCHASE_STATUS_META } from "@/lib/status-meta";
import { PURCHASE_STATUSES, type PurchaseItem, type PurchaseStatus } from "@/types";
import { SectionCard } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { QueryView } from "@/components/ui/QueryView";
import { Select, type SelectOption } from "@/components/ui/Select";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/StatePanels";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { INITIAL_PURCHASE_FILTERS, purchaseQueries } from "../queries";

type StatusFilter = PurchaseStatus | "ALL";
type SortKey = `${PurchaseFilters["sort"]}:${PurchaseFilters["order"]}`;

const STATUS_OPTIONS: SelectOption<StatusFilter>[] = [
  { value: "ALL", label: "All statuses" },
  ...PURCHASE_STATUSES.map((status) => ({ value: status, label: PURCHASE_STATUS_META[status].label })),
];

const SORT_OPTIONS: SelectOption<SortKey>[] = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "amountCents:desc", label: "Highest amount" },
  { value: "amountCents:asc", label: "Lowest amount" },
];

export function PurchasesPanel() {
  const [filters, setFilters] = useState<PurchaseFilters>(INITIAL_PURCHASE_FILTERS);
  const query = useQuery(purchaseQueries.list(filters));
  const update = (patch: Partial<PurchaseFilters>) => setFilters((current) => ({ ...current, page: 1, ...patch }));

  return (
    <SectionCard
      titleId="purchases-heading"
      title="Recent purchases"
      description="Sales across all your videos."
      actions={
        <>
          <Select
            label="Filter purchases by status"
            hideLabel
            options={STATUS_OPTIONS}
            value={filters.status ?? "ALL"}
            onChange={(status) => update({ status: status === "ALL" ? undefined : status })}
            className="w-full sm:w-40"
          />
          <Select
            label="Sort purchases"
            hideLabel
            options={SORT_OPTIONS}
            value={`${filters.sort}:${filters.order}`}
            onChange={(value) => {
              const [sort, order] = value.split(":") as [PurchaseFilters["sort"], PurchaseFilters["order"]];
              update({ sort, order });
            }}
            className="w-full sm:w-44"
          />
        </>
      }
    >
      <QueryView query={query} errorTitle="We couldn't load your purchases" skeleton={<PurchasesSkeleton />}>
        {(data) =>
          data.totalItems === 0 ? (
            <EmptyState
              icon={Receipt}
              title={filters.status ? `No ${PURCHASE_STATUS_META[filters.status].label.toLowerCase()} purchases` : "No purchases yet"}
              description={
                filters.status
                  ? "Try another status to see more of your sales."
                  : "Once your published videos start selling, every purchase will show up here."
              }
            />
          ) : (
            <div aria-busy={query.isFetching} className={clsx("transition-opacity", query.isPlaceholderData && "opacity-60")}>
              <PurchasesTable items={data.items} />
              <PurchasesList items={data.items} />
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                totalItems={data.totalItems}
                pageSize={data.pageSize}
                itemLabel="purchases"
                disabled={query.isPlaceholderData}
                onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
              />
            </div>
          )
        }
      </QueryView>
    </SectionCard>
  );
}

function Country({ code }: { code: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true">{countryFlag(code)}</span>
      {formatCountry(code)}
    </span>
  );
}

function PurchaseStatusBadge({ status }: { status: PurchaseStatus }) {
  const meta = PURCHASE_STATUS_META[status];
  return <StatusBadge label={meta.label} tone={meta.tone} />;
}

function PurchasesTable({ items }: { items: PurchaseItem[] }) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full text-sm">
        <caption className="sr-only">Recent purchases</caption>
        <thead>
          <tr className="border-b border-line text-left text-xs tracking-wide text-muted uppercase">
            <th scope="col" className="py-3 pr-3 pl-5 font-medium">Date</th>
            <th scope="col" className="px-3 py-3 font-medium">Content</th>
            <th scope="col" className="px-3 py-3 font-medium">Country</th>
            <th scope="col" className="px-3 py-3 text-right font-medium">Amount</th>
            <th scope="col" className="py-3 pr-5 pl-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {items.map((purchase) => (
            <tr key={purchase.id} className="hover:bg-subtle/60">
              <td className="py-3 pr-3 pl-5 whitespace-nowrap text-muted tabular-nums">{formatDate(purchase.createdAt)}</td>
              <td className="max-w-xs truncate px-3 py-3 font-medium text-fg">{purchase.contentTitle}</td>
              <td className="px-3 py-3 whitespace-nowrap text-muted">
                <Country code={purchase.buyerCountry} />
              </td>
              <td className="px-3 py-3 text-right font-medium text-fg tabular-nums">{formatCurrency(purchase.amountCents)}</td>
              <td className="py-3 pr-5 pl-3">
                <PurchaseStatusBadge status={purchase.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PurchasesList({ items }: { items: PurchaseItem[] }) {
  return (
    <ul className="divide-y divide-line md:hidden" aria-label="Recent purchases">
      {items.map((purchase) => (
        <li key={purchase.id} className="flex items-start justify-between gap-3 px-4 py-3.5">
          <div className="min-w-0">
            <p className="truncate font-medium text-fg">{purchase.contentTitle}</p>
            <p className="mt-0.5 text-sm text-muted">
              {formatDate(purchase.createdAt)} · <Country code={purchase.buyerCountry} />
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="font-semibold text-fg tabular-nums">{formatCurrency(purchase.amountCents)}</span>
            <PurchaseStatusBadge status={purchase.status} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function PurchasesSkeleton() {
  return (
    <LoadingRegion label="Loading purchases" className="divide-y divide-line">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </LoadingRegion>
  );
}
