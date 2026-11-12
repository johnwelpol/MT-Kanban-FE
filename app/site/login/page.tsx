import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/lib/env";
import { WorkspaceForm } from "./workspace-form";

export const metadata: Metadata = { title: "Log in" };

export default function SiteLoginPage() {
  return (
    <div className="flex flex-1 items-start justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Log in to your workspace</CardTitle>
          <CardDescription>Enter your workspace&apos;s URL to continue.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <WorkspaceForm rootDomain={env.ROOT_DOMAIN} />
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t know your workspace URL?{" "}
            <Link href="/find-workspace" className="text-foreground underline underline-offset-4">
              Find your workspaces
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
