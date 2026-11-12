import { redirect } from "next/navigation";
import { MeProvider } from "@/components/me-provider";
import { Providers } from "@/components/providers";
import { MobileNav } from "@/components/shell/mobile-nav";
import { Sidebar } from "@/components/shell/sidebar";
import { UserMenu } from "@/components/shell/user-menu";
import { ApiError, getMe, tenantApi } from "@/lib/api";
import type { BoardSummary, Me } from "@/lib/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let me: Me;
  let boards: BoardSummary[];
  try {
    [me, boards] = await Promise.all([getMe(), tenantApi<BoardSummary[]>("/boards")]);
  } catch (e) {
    if (e instanceof ApiError && e.status === 403) redirect("/logout");
    throw e;
  }

  return (
    <Providers>
      <MeProvider me={me}>
        <div className="flex min-h-svh flex-1">
          <aside className="hidden w-64 shrink-0 border-r md:block">
            <div className="sticky top-0 h-svh">
              <Sidebar boards={boards} />
            </div>
          </aside>
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex h-14 items-center gap-2 border-b px-4">
              <MobileNav boards={boards} />
              <span className="truncate font-semibold md:hidden">{me.workspace.name}</span>
              <div className="ml-auto">
                <UserMenu />
              </div>
            </header>
            <main className="flex min-w-0 flex-1 flex-col">{children}</main>
          </div>
        </div>
      </MeProvider>
    </Providers>
  );
}
