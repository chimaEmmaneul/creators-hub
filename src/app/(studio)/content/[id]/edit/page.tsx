import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/PageHeader";
import { EditContentForm } from "@/features/content/components/form/EditContentForm";
import { queryKeys } from "@/lib/query/keys";
import { getServerQueryClient } from "@/server/query-client";
import { loadContentOrNotFound } from "../load-content";

export async function generateMetadata({ params }: PageProps<"/content/[id]/edit">): Promise<Metadata> {
  const { item } = await loadContentOrNotFound((await params).id);
  return { title: `Edit “${item.title}”` };
}

export default async function EditContentPage({ params }: PageProps<"/content/[id]/edit">) {
  const { item } = await loadContentOrNotFound((await params).id);
  const queryClient = getServerQueryClient();
  queryClient.setQueryData(queryKeys.content.detail(item.id), item);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Edit video" description={item.title} />
        <EditContentForm id={item.id} />
      </div>
    </HydrationBoundary>
  );
}
