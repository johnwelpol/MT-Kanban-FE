import { Skeleton } from "@/components/ui/skeleton";

export default function BoardLoading() {
  return (
    <div className="grid gap-4 p-6" aria-busy="true" aria-label="Loading board">
      <Skeleton className="h-7 w-56" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="grid w-72 shrink-0 gap-2 rounded-xl bg-muted/50 p-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
