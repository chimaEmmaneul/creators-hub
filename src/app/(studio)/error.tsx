"use client";

import { useEffect, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";

export default function RouteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const [retrying, startTransition] = useTransition();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card>
      <ErrorState
        title="This page didn't load"
        description="Something went wrong while loading your data. It's usually temporary."
        onRetry={() => startTransition(retry)}
        retrying={retrying}
      />
    </Card>
  );
}
