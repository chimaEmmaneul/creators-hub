"use client";

import { AlertTriangle, Clock3, ShieldAlert, type LucideIcon } from "lucide-react";
import type { VerificationStatus } from "@/types";
import { useCurrentCreator } from "@/features/account/queries";
import { ButtonLink } from "@/components/ui/Button";

const COPY: Record<Exclude<VerificationStatus, "VERIFIED">, { icon: LucideIcon; title: string; body: string; cta?: string }> = {
  UNVERIFIED: {
    icon: ShieldAlert,
    title: "Verify your identity to start earning",
    body: "You can upload and save drafts now. Publishing paid content needs a quick identity check (about 3 minutes).",
    cta: "Verify now",
  },
  PENDING: {
    icon: Clock3,
    title: "Verification in review",
    body: "We're checking your details. Publishing unlocks automatically once you're approved.",
  },
  REJECTED: {
    icon: AlertTriangle,
    title: "Action needed on your verification",
    body: "We couldn't approve your verification yet. Fix the item we flagged and resubmit; your other details are saved.",
    cta: "Review and fix",
  },
};

export function VerificationBanner() {
  const { data: creator } = useCurrentCreator();
  if (!creator || creator.verificationStatus === "VERIFIED") return null;

  const { icon: Icon, title, body, cta } = COPY[creator.verificationStatus];
  return (
    <aside
      aria-label="Account verification"
      className="flex flex-col gap-4 rounded-xl border border-warning/30 bg-warning-soft p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
    >
      <div className="flex gap-3">
        <Icon className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
        <div>
          <p className="font-semibold text-fg">{title}</p>
          <p className="mt-0.5 text-sm text-muted text-pretty">{body}</p>
        </div>
      </div>
      {cta && (
        <ButtonLink href="/verify" className="sm:shrink-0">
          {cta}
        </ButtonLink>
      )}
    </aside>
  );
}
