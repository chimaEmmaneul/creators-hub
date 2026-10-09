import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <LoadingRegion label="Loading your dashboard" className="flex flex-col gap-6 lg:gap-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-52" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className={i < 2 ? "col-span-2 h-32 rounded-xl sm:col-span-1" : "h-32 rounded-xl"} />
        ))}
      </div>
      <Skeleton className="h-96 rounded-xl" />
      <Skeleton className="h-112 rounded-xl" />
    </LoadingRegion>
  );
}
