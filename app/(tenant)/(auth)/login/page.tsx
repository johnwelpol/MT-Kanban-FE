import type { Metadata } from "next";
import { rootUrl } from "@/lib/urls";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

const BANNERS: Record<string, string> = {
  expired: "Your session expired. Please log in again.",
  reset: "Password updated, please log in.",
  handoff: "That sign-in link expired. Please log in.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const banner =
    params.expired === "1"
      ? BANNERS.expired
      : params.reset === "1"
        ? BANNERS.reset
        : params.error === "handoff"
          ? BANNERS.handoff
          : null;
  const next = typeof params.next === "string" ? params.next : undefined;

  return (
    <div className="grid gap-4">
      {banner && (
        <p role="status" className="rounded-lg bg-muted px-3 py-2 text-sm">
          {banner}
        </p>
      )}
      <LoginForm next={next} />
      <p className="text-center text-sm text-muted-foreground">
        Want your own workspace?{" "}
        <a href={rootUrl("/register")} className="text-foreground underline underline-offset-4">
          Create one
        </a>
      </p>
    </div>
  );
}
