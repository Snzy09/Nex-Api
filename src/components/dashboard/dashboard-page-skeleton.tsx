import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid gap-4 grid-cols-2">
        {[...Array(2)].map((_, i) => (
            <Card key={i}>
                <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-6 w-1/4" />
                </CardContent>
            </Card>
        ))}
      </div>
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
            <Card key={i}>
                <CardContent className="p-4 flex items-center">
                    <Skeleton className="h-8 w-8 mr-4" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-4 w-1/4" />
                    </div>
                    <Skeleton className="h-6 w-6" />
                </CardContent>
            </Card>
        ))}
      </div>
    </div>
  );
}
