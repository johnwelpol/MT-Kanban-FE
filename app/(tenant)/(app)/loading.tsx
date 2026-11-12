import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="grid gap-4 p-6" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-7 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    </div>
  );
}
