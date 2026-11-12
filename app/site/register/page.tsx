import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/lib/env";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Create your workspace" };

export default function RegisterPage() {
  return (
    <div className="flex flex-1 items-start justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Create your workspace</CardTitle>
          <CardDescription>You&apos;ll be its owner and can invite your team.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm rootDomain={env.ROOT_DOMAIN} />
        </CardContent>
      </Card>
    </div>
  );
}
