"use client";

import { Button } from "@/components/ui/button";

export default function AppError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        We couldn&apos;t load this page. Check your connection and try again.
      </p>
      <Button onClick={() => retry()}>Try again</Button>
    </div>
  );
}
