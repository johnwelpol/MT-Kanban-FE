import { Lock } from "lucide-react";
import type { Metadata } from "next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMe } from "@/lib/api";
import { env } from "@/lib/env";
import { can } from "@/lib/permissions";
import { WorkspaceForm } from "./workspace-form";

export const metadata: Metadata = { title: "Workspace settings" };

export default async function WorkspaceSettingsPage() {
  const me = await getMe();

  if (!can(me, "workspace.update")) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <Lock className="size-6 text-muted-foreground" aria-hidden />
        <h1 className="text-lg font-semibold">You don&apos;t have access to workspace settings</h1>
        <p className="max-w-sm text-sm text-muted-foreground">Ask an owner or admin if something needs to change.</p>
      </div>
    );
  }

  return (
    <div className="grid max-w-xl gap-8 p-6">
      <h1 className="text-xl font-semibold">Workspace settings</h1>
      <WorkspaceForm name={me.workspace.name} />
      <div className="grid gap-1.5">
        <Label htmlFor="workspace-url">Workspace URL</Label>
        <Input id="workspace-url" value={`${me.workspace.slug}.${env.ROOT_DOMAIN}`} readOnly className="bg-muted" />
        <p className="text-sm text-muted-foreground">The workspace URL can&apos;t be changed.</p>
      </div>
    </div>
  );
}
