import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/lib/env";
import { getPublicWorkspace } from "@/lib/api";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const workspace = await getPublicWorkspace();

  return (
    <main className="flex flex-1 items-start justify-center px-4 py-12 sm:items-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">{workspace.name}</CardTitle>
          <CardDescription>
            {workspace.slug}.{env.ROOT_DOMAIN}
          </CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </main>
  );
}
