"use client";

import Link from "next/link";
import { formatCompactNumber, formatCurrency, formatInteger } from "@/lib/format";
import type { ContentItem } from "@/types";
import { Thumbnail } from "@/components/ui/Thumbnail";
import type { ContentActions } from "../hooks/use-content-actions";
import { ContentRowActions } from "./ContentRowActions";
import { ContentStatusBadge } from "./ContentStatusBadge";

type ListProps = { items: ContentItem[]; actions: ContentActions };

function TitleCell({ item }: { item: ContentItem }) {
  return (
    <Link href={`/content/${item.id}`} className="line-clamp-2 font-medium text-fg hover:text-accent hover:underline">
      {item.title}
    </Link>
  );
}

export function ContentTable({ items, actions }: ListProps) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full text-sm">
        <caption className="sr-only">Your content, with price, performance and status</caption>
        <thead>
          <tr className="border-b border-line text-left text-xs font-medium tracking-wide text-muted uppercase">
            <th scope="col" className="py-3 pr-3 pl-5 font-medium">Video</th>
            <th scope="col" className="px-3 py-3 text-right font-medium">Price</th>
            <th scope="col" className="px-3 py-3 text-right font-medium">Views</th>
            <th scope="col" className="px-3 py-3 text-right font-medium">Purchases</th>
            <th scope="col" className="px-3 py-3 text-right font-medium">Revenue</th>
            <th scope="col" className="px-3 py-3 font-medium">Status</th>
            <th scope="col" className="py-3 pr-5 pl-3 text-right font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {items.map((item) => (
            <tr key={item.id} className="transition-colors hover:bg-subtle/60">
              <td className="py-3 pr-3 pl-5">
                <div className="flex items-center gap-3">
                  <Thumbnail src={item.thumbnailUrl} sizes="96px" className="w-24 shrink-0" />
                  <TitleCell item={item} />
                </div>
              </td>
              <td className="px-3 py-3 text-right text-fg tabular-nums">{formatCurrency(item.priceCents)}</td>
              <td className="px-3 py-3 text-right text-muted tabular-nums">{formatCompactNumber(item.views)}</td>
              <td className="px-3 py-3 text-right text-muted tabular-nums">{formatInteger(item.purchaseCount)}</td>
              <td className="px-3 py-3 text-right font-medium text-fg tabular-nums">{formatCurrency(item.revenueCents)}</td>
              <td className="px-3 py-3">
                <ContentStatusBadge item={item} />
              </td>
              <td className="py-3 pr-5 pl-3">
                <ContentRowActions item={item} actions={actions} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ContentCards({ items, actions }: ListProps) {
  return (
    <ul className="divide-y divide-line md:hidden" aria-label="Your content">
      {items.map((item) => (
        <li key={item.id} className="flex flex-col gap-3 px-4 py-4">
          <div className="flex gap-3">
            <Thumbnail src={item.thumbnailUrl} sizes="128px" className="w-32 shrink-0" />
            <div className="flex min-w-0 flex-col gap-1.5">
              <TitleCell item={item} />
              <ContentStatusBadge item={item} />
            </div>
          </div>
          <dl className="grid grid-cols-4 gap-2 rounded-lg bg-subtle px-3 py-2 text-center">
            {[
              ["Price", formatCurrency(item.priceCents)],
              ["Views", formatCompactNumber(item.views)],
              ["Sales", formatInteger(item.purchaseCount)],
              ["Revenue", formatCurrency(item.revenueCents)],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="truncate text-sm font-medium text-fg tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          <ContentRowActions item={item} actions={actions} />
        </li>
      ))}
    </ul>
  );
}
