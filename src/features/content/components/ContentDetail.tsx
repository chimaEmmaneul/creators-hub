"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Play, Rocket, Trash2 } from "lucide-react";
import { formatCompactNumber, formatCurrency, formatDate, formatDateTime, formatFileSize, formatInteger } from "@/lib/format";
import type { ContentItem } from "@/types";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { QueryView } from "@/components/ui/QueryView";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";
import { Thumbnail } from "@/components/ui/Thumbnail";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { contentQueries } from "../queries";
import { useContentActions } from "../hooks/use-content-actions";
import { ContentActionDialogs } from "./ContentActionDialogs";
import { ContentStatusBadge } from "./ContentStatusBadge";

export function ContentDetail({ id }: { id: string }) {
  const query = useQuery(contentQueries.detail(id));
  return (
    <QueryView
      query={query}
      errorTitle="We couldn't load this video"
      skeleton={
        <LoadingRegion label="Loading video">
          <Skeleton className="aspect-video rounded-xl" />
        </LoadingRegion>
      }
    >
      {(item) => <Detail item={item} />}
    </QueryView>
  );
}

function Detail({ item }: { item: ContentItem }) {
  const router = useRouter();
  const actions = useContentActions({ onDeleteConfirmed: () => router.push("/") });
  const conversion = item.views > 0 ? item.purchaseCount / item.views : null;

  const stats = [
    { label: "Revenue", value: formatCurrency(item.revenueCents) },
    { label: "Purchases", value: formatInteger(item.purchaseCount) },
    { label: "Views", value: formatCompactNumber(item.views) },
    { label: "Conversion", value: conversion === null ? "—" : `${(conversion * 100).toFixed(1)}%` },
  ];

  const details = [
    { label: "Price", value: formatCurrency(item.priceCents) },
    { label: "Video file", value: `${item.videoFileName} (${formatFileSize(item.videoSizeBytes)})` },
    { label: "Created", value: formatDate(item.createdAt) },
    item.publishedAt && { label: "Published", value: formatDateTime(item.publishedAt) },
    item.scheduledAt && { label: "Goes live", value: formatDateTime(item.scheduledAt) },
  ].filter((detail): detail is { label: string; value: string } => Boolean(detail));

  return (
    <article className="flex flex-col gap-6" aria-labelledby="content-title">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 id="content-title" className="text-2xl font-semibold tracking-tight text-fg text-balance">
            {item.title}
          </h1>
          <div className="mt-2">
            <ContentStatusBadge item={item} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {item.status === "DRAFT" && (
            <Button onClick={() => actions.publish(item)} loading={actions.publishingId === item.id}>
              <Rocket className="size-4" aria-hidden="true" />
              Publish
            </Button>
          )}
          <ButtonLink href={`/content/${item.id}/edit`} variant="secondary">
            <Pencil className="size-4" aria-hidden="true" />
            Edit
          </ButtonLink>
          <Button variant="secondary" className="text-danger" onClick={() => actions.requestDelete(item)} aria-haspopup="dialog">
            <Trash2 className="size-4" aria-hidden="true" />
            Delete
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <VideoPreview item={item} />

        <div className="flex flex-col gap-4">
          <Card className="p-4">
            <h2 className="sr-only">Performance</h2>
            <dl className="grid grid-cols-2 gap-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="text-xs text-muted">{stat.label}</dt>
                  <dd className="mt-0.5 text-xl font-semibold text-fg tabular-nums">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold text-fg">Details</h2>
            <dl className="flex flex-col gap-2.5 text-sm">
              {details.map((detail) => (
                <div key={detail.label} className="flex justify-between gap-4">
                  <dt className="text-muted">{detail.label}</dt>
                  <dd className="min-w-0 truncate text-right text-fg">{detail.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>

      <Card className="p-4 sm:p-6">
        <h2 className="mb-2 text-sm font-semibold text-fg">Description</h2>
        <p className="text-sm whitespace-pre-line text-muted text-pretty">{item.description}</p>
      </Card>

      <ContentActionDialogs actions={actions} />
    </article>
  );
}

function VideoPreview({ item }: { item: ContentItem }) {
  if (!item.videoUrl) {
    return (
      <figure className="flex flex-col gap-2">
        <div className="relative">
          <Thumbnail src={item.thumbnailUrl} sizes="(max-width: 1024px) 100vw, 720px" priority className="rounded-xl shadow-card" />
          <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
            <span className="grid size-16 place-items-center rounded-full bg-black/55 text-white backdrop-blur">
              <Play className="ml-1 size-7" />
            </span>
          </span>
        </div>
        <figcaption className="text-xs text-muted">Preview unavailable: uploads are simulated in this demo.</figcaption>
      </figure>
    );
  }

  return (
    <figure className="flex flex-col gap-2">
      <VideoPlayer key={item.videoUrl} src={item.videoUrl} poster={item.thumbnailUrl ?? undefined} title={item.title} />
      {item.videoCredit && (
        <figcaption className="text-xs text-muted">
          Demo video:{" "}
          {item.videoCreditUrl ? (
            <a href={item.videoCreditUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-fg">
              {item.videoCredit}
            </a>
          ) : (
            item.videoCredit
          )}
        </figcaption>
      )}
    </figure>
  );
}
