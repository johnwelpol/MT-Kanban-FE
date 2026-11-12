import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";
import { rootUrl } from "@/lib/urls";

export const metadata: Metadata = { title: "Workspace not found" };

export default function TenantNotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Workspace not found</h1>
      <p className="max-w-sm text-muted-foreground">
        There is no workspace at this address. Check the URL or find your workspace.
      </p>
      <a href={rootUrl("/login")} className={buttonVariants()}>
        Find your workspace
      </a>
    </main>
  );
}
