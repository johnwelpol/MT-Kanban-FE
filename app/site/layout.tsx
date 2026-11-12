import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function SiteLayout({ children }: LayoutProps<"/site">) {
  return (
    <>
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="font-semibold">
            Kanban
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
              Log in
            </Link>
            <Link href="/register" className={buttonVariants()}>
              Get started
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </>
  );
}
