import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";

export default function VerifyLoading() {
  return (
    <LoadingRegion label="Loading verification" className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="flex justify-between gap-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="size-8 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </LoadingRegion>
  );
}
