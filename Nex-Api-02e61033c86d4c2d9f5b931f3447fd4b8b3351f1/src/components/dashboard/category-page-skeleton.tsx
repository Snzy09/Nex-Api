import { Skeleton } from "@/components/ui/skeleton";

export function CategoryPageSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-5 w-80" />
      </div>

      <Skeleton className="h-10 w-full" />

      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-[73px] w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
