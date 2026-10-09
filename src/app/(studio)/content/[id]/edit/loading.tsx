import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";

export default function EditContentLoading() {
  return (
    <LoadingRegion label="Loading editor" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </LoadingRegion>
  );
}
