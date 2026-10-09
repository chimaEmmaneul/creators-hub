"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { ChevronsUpDown, LogOut, RotateCcw } from "lucide-react";
import { Button as AriaButton, Dialog, DialogTrigger, Popover } from "react-aria-components";
import { toast } from "sonner";
import { errorMessage } from "@/lib/api-client";
import { VERIFICATION_STATUS_META } from "@/lib/status-meta";
import type { CreatorSummary } from "@/types";
import { useCurrentCreator } from "@/features/account/queries";
import { useLeaveStudio } from "@/features/auth/hooks/use-auth";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { popoverClasses } from "@/components/ui/aria-field";
import { ThemeToggle } from "./ThemeToggle";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span aria-hidden="true" className={clsx("grid shrink-0 place-items-center rounded-full bg-accent-soft font-semibold text-accent-soft-fg", className)}>
      {initials(name)}
    </span>
  );
}

function CreatorStatus({ creator }: { creator: CreatorSummary }) {
  const status = VERIFICATION_STATUS_META[creator.verificationStatus];
  return <StatusBadge label={status.label} tone={status.tone} />;
}

export function AccountMenu({ variant }: { variant: "sidebar" | "compact" }) {
  const { data: creator } = useCurrentCreator();
  const { signOut, resetDemo } = useLeaveStudio();
  const [open, setOpen] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);

  if (!creator) return null;

  return (
    <>
      <DialogTrigger isOpen={open} onOpenChange={setOpen}>
        <AriaButton
          aria-label={`Account menu for ${creator.name}`}
          className={clsx(
            "flex cursor-pointer items-center rounded-xl text-left outline-none transition-colors data-focus-visible:outline-2 data-focus-visible:outline-ring",
            variant === "sidebar" ? "w-full gap-3 p-2 hover:bg-subtle data-pressed:bg-subtle" : "size-11 justify-center rounded-full",
          )}
        >
          <Avatar name={creator.name} className="size-9 text-sm" />
          {variant === "sidebar" && (
            <>
              <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                <span className="w-full truncate text-sm font-medium text-fg">{creator.name}</span>
                <CreatorStatus creator={creator} />
              </span>
              <ChevronsUpDown className="size-4 shrink-0 text-muted" aria-hidden="true" />
            </>
          )}
        </AriaButton>
        <Popover className={clsx(popoverClasses, "w-72")} placement={variant === "sidebar" ? "top start" : "bottom end"} offset={8}>
          <Dialog aria-label="Account" className="flex flex-col gap-4 p-4 outline-none">
            <div className="flex items-center gap-3">
              <Avatar name={creator.name} className="size-10" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-fg">{creator.name}</p>
                <p className="truncate text-xs text-muted">{creator.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-lg bg-subtle px-3 py-2 text-xs text-muted">
              Verification
              <CreatorStatus creator={creator} />
            </div>
            <ThemeToggle />
            <div className="flex flex-col gap-1 border-t border-line pt-3">
              <Button
                variant="ghost"
                size="sm"
                className="justify-start"
                onClick={() => {
                  setOpen(false);
                  setConfirmingReset(true);
                }}
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Reset demo data
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start"
                loading={signOut.isPending}
                onClick={() => signOut.mutate(undefined, { onError: (error) => toast.error(errorMessage(error)) })}
              >
                {!signOut.isPending && <LogOut className="size-4" aria-hidden="true" />}
                Sign out
              </Button>
            </div>
          </Dialog>
        </Popover>
      </DialogTrigger>

      <ConfirmDialog
        open={confirmingReset}
        title="Reset demo data?"
        description="All content, purchases, accounts and verification progress return to the original seed. You'll be signed out."
        confirmLabel="Reset and sign out"
        pending={resetDemo.isPending}
        onConfirm={() => resetDemo.mutate(undefined, { onError: (error) => toast.error(errorMessage(error)) })}
        onCancel={() => setConfirmingReset(false)}
      />
    </>
  );
}
