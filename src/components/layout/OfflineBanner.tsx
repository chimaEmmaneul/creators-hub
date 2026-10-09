"use client";

import { WifiOff } from "lucide-react";
import { useOffline } from "next/offline";

export function OfflineBanner() {
  const offline = useOffline();
  return (
    <div role="status" aria-live="polite">
      {offline && (
        <p className="flex items-center justify-center gap-2 bg-warning-soft px-4 py-2 text-sm font-medium text-warning animate-fade-in">
          <WifiOff className="size-4" aria-hidden="true" />
          You&apos;re offline. We&apos;ll reconnect automatically.
        </p>
      )}
    </div>
  );
}
