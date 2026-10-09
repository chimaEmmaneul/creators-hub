import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";

export default function ContentLoading() {
  return (
    <LoadingRegion label="Loading video" className="flex flex-col gap-6">
      <Skeleton className="h-4 w-36" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Skeleton className="aspect-video rounded-xl" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    </LoadingRegion>
  );
}
