"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FilmIcon, Plus, SearchX } from "lucide-react";
import { CONTENT_STATUS_META } from "@/lib/status-meta";
import type { ContentItem } from "@/types";
import { ButtonLink, Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/Card";
import { Input } from "@/components/ui/FormField";
import { QueryView } from "@/components/ui/QueryView";
import { Select } from "@/components/ui/Select";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";
import { Pagination } from "@/components/ui/Pagination";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { EmptyState } from "@/components/ui/StatePanels";
import { useContentActions } from "../hooks/use-content-actions";
import {
  INITIAL_LIBRARY_QUERY,
  LIBRARY_PAGE_SIZE,
  LIBRARY_SORTS,
  countByStatus,
  queryLibrary,
  type LibraryQuery,
  type LibrarySort,
  type StatusFilter,
} from "../lib/library-query";
import { ContentActionDialogs } from "./ContentActionDialogs";
import { ContentCards, ContentTable } from "./ContentList";
import { contentQueries } from "../queries";

const SORT_OPTIONS = Object.entries(LIBRARY_SORTS).map(([value, { label }]) => ({ value: value as LibrarySort, label }));

export function ContentLibrary() {
  const listQuery = useQuery(contentQueries.list());
  return (
    <SectionCard
      titleId="library-heading"
      title="Your content"
      description="Manage videos, prices and publishing."
      actions={
        <ButtonLink href="/content/new" size="sm">
          <Plus className="size-4" aria-hidden="true" />
          Upload video
        </ButtonLink>
      }
    >
      <QueryView query={listQuery} errorTitle="We couldn't load your videos" skeleton={<LibrarySkeleton />}>
        {(items) => <Library items={items} refreshing={listQuery.isFetching} />}
      </QueryView>
    </SectionCard>
  );
}

function LibrarySkeleton() {
  return (
    <LoadingRegion label="Loading your videos" className="divide-y divide-line">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-4">
          <Skeleton className="aspect-video w-24 rounded-lg" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </LoadingRegion>
  );
}

function Library({ items, refreshing }: { items: ContentItem[]; refreshing: boolean }) {
  const [query, setQuery] = useState<LibraryQuery>(INITIAL_LIBRARY_QUERY);
  const actions = useContentActions();
  const result = useMemo(() => queryLibrary(items, query), [items, query]);
  const counts = useMemo(() => countByStatus(items), [items]);

  const update = (patch: Partial<Omit<LibraryQuery, "page">>) => setQuery((q) => ({ ...q, ...patch, page: 1 }));

  const statusOptions = (["ALL", "PUBLISHED", "SCHEDULED", "DRAFT"] as const).map((value) => ({
    value,
    label: value === "ALL" ? "All" : CONTENT_STATUS_META[value].label,
    badge: counts[value],
  }));

  return (
    <>
      {items.length === 0 ? (
        <EmptyState
          icon={FilmIcon}
          title="Upload your first video"
          description="Add a title, price and video file. You can save it as a draft and publish whenever you're ready."
          action={<ButtonLink href="/content/new">Upload video</ButtonLink>}
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
            <SegmentedControl legend="Filter by status" options={statusOptions} value={query.status} onChange={(status: StatusFilter) => update({ status })} />
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor="library-search">
                Search content by title
              </label>
              <Input
                id="library-search"
                type="search"
                placeholder="Search titles…"
                value={query.search}
                onChange={(event) => update({ search: event.target.value })}
                className="sm:w-56"
              />
              <Select label="Sort videos" hideLabel options={SORT_OPTIONS} value={query.sort} onChange={(sort) => update({ sort })} className="sm:w-44" />
            </div>
          </div>

          {result.totalItems === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No matching videos"
              description="Try a different search term or status filter."
              action={
                <Button variant="secondary" onClick={() => setQuery(INITIAL_LIBRARY_QUERY)}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div aria-busy={refreshing}>
              <ContentTable items={result.pageItems} actions={actions} />
              <ContentCards items={result.pageItems} actions={actions} />
              <Pagination
                page={result.page}
                totalPages={result.totalPages}
                totalItems={result.totalItems}
                pageSize={LIBRARY_PAGE_SIZE}
                itemLabel="videos"
                onPageChange={(page) => setQuery((q) => ({ ...q, page }))}
              />
            </div>
          )}
        </>
      )}
      <ContentActionDialogs actions={actions} />
    </>
  );
}
