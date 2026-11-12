import type { Metadata } from "next";
import Link from "next/link";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { token, email } = await searchParams;

  if (typeof token !== "string" || typeof email !== "string" || !token || !email) {
    return (
      <div className="grid gap-4 text-sm">
        <p>This password reset link is invalid. Request a new one.</p>
        <Link href="/forgot-password" className="underline underline-offset-4">
          Request a new link
        </Link>
      </div>
    );
  }
  return <ResetForm token={token} email={email} />;
}
