"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { NAV_ITEMS, isActivePath } from "./nav-items";

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActivePath(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
              active ? "bg-accent-soft text-accent-soft-fg" : "text-muted hover:bg-subtle hover:text-fg",
            )}
          >
            <Icon className="size-4.5" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-3">
        {NAV_ITEMS.map(({ href, shortLabel, icon: Icon }) => {
          const active = isActivePath(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                  active ? "text-accent" : "text-muted hover:text-fg",
                )}
              >
                <Icon className="size-5.5" aria-hidden="true" strokeWidth={active ? 2.25 : 1.75} />
                {shortLabel}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
