import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FindForm } from "./find-form";

export const metadata: Metadata = { title: "Find your workspaces" };

export default function FindWorkspacePage() {
  return (
    <div className="flex flex-1 items-start justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Find your workspaces</CardTitle>
          <CardDescription>We&apos;ll email you a link to every workspace you belong to.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <FindForm />
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-foreground underline underline-offset-4">
              Back to log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
