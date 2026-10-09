"use client";

import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCurrentCreator } from "@/features/account/queries";

export function DashboardGreeting({ actions }: { actions?: ReactNode }) {
  const { data: creator } = useCurrentCreator();
  const firstName = creator?.name.split(" ")[0];
  return (
    <PageHeader
      title={firstName ? `Welcome back, ${firstName}` : "Dashboard"}
      description="Here's how your content is performing."
      actions={actions}
    />
  );
}
