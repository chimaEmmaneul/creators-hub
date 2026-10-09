import Link from "next/link";
import { Clapperboard } from "lucide-react";
import type { ReactNode } from "react";
import { AccountMenu } from "./AccountMenu";
import { MobileTabBar, SidebarNav } from "./NavLinks";
import { OfflineBanner } from "./OfflineBanner";

function Brand() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 rounded-lg font-semibold tracking-tight text-fg"
    >
      <span className="grid size-8 place-items-center rounded-lg bg-accent text-on-accent shadow-card">
        <Clapperboard className="size-4.5" aria-hidden="true" />
      </span>
      <span>
        CreatorHub <span className="font-normal text-muted">Studio</span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-lg bg-accent px-4 py-2 text-on-accent focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to main content
      </a>

      <aside className="sticky top-0 hidden h-dvh flex-col gap-8 border-r border-line bg-surface px-4 py-6 lg:flex">
        <div className="px-2">
          <Brand />
        </div>
        <SidebarNav />
        <div className="mt-auto border-t border-line pt-4">
          <AccountMenu variant="sidebar" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur-lg sm:px-6 lg:hidden">
          <Brand />
          <AccountMenu variant="compact" />
        </header>
        <OfflineBanner />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 px-4 pt-6 pb-28 outline-none sm:px-6 lg:px-10 lg:pt-10 lg:pb-12"
        >
          <div className="mx-auto w-full">{children}</div>
        </main>
      </div>

      <MobileTabBar />
    </div>
  );
}
