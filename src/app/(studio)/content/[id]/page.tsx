import type { Metadata } from "next";
import Link from "next/link";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { ContentDetail } from "@/features/content/components/ContentDetail";
import { queryKeys } from "@/lib/query/keys";
import { getServerQueryClient } from "@/server/query-client";
import { loadContentOrNotFound } from "./load-content";

export async function generateMetadata({ params }: PageProps<"/content/[id]">): Promise<Metadata> {
  const { item } = await loadContentOrNotFound((await params).id);
  return { title: item.title };
}

export default async function ContentPage({ params }: PageProps<"/content/[id]">) {
  const { item } = await loadContentOrNotFound((await params).id);
  const queryClient = getServerQueryClient();
  queryClient.setQueryData(queryKeys.content.detail(item.id), item);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex flex-col gap-6">
        <Link href="/" className="inline-flex w-fit items-center gap-1.5 rounded-md text-sm font-medium text-muted hover:text-fg">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to dashboard
        </Link>
        <ContentDetail id={item.id} />
      </div>
    </HydrationBoundary>
  );
}
