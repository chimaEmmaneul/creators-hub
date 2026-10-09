"use client";

import { AlertTriangle, RotateCw, WifiOff } from "lucide-react";
import { useOffline } from "next/offline";
import { errorMessage } from "@/lib/api-client";
import { Button } from "./Button";
import { StatePanel } from "./StatePanels";

interface ErrorStateProps {
  title?: string;
  description?: string;
  error?: unknown;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}

export function ErrorState({ title = "We couldn't load this", description, error, onRetry, retrying = false, className }: ErrorStateProps) {
  const offline = useOffline();
  return (
    <StatePanel
      role="alert"
      tone="danger"
      icon={offline ? WifiOff : AlertTriangle}
      title={offline ? "You're offline" : title}
      description={offline ? "This will load once your connection is back." : (description ?? errorMessage(error))}
      className={className}
      action={
        onRetry && (
          <Button variant="secondary" onClick={onRetry} loading={retrying}>
            {!retrying && <RotateCw className="size-4" aria-hidden="true" />}
            {retrying ? "Retrying…" : "Try again"}
          </Button>
        )
      }
    />
  );
}
