"use client";

import { ShieldAlert } from "lucide-react";
import { ButtonLink, Button } from "@/components/ui/Button";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import type { ContentActions } from "../hooks/use-content-actions";

export function PublishBlockedDialog({ message, onClose }: { message: string | null; onClose: () => void }) {
  return (
    <Dialog
      open={message !== null}
      onClose={onClose}
      title="Verify your identity to publish"
      description={message}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} data-autofocus>
            Keep as draft
          </Button>
          <ButtonLink href="/verify">Start verification</ButtonLink>
        </>
      }
    >
      <div className="flex gap-3 rounded-lg bg-subtle p-3 text-sm text-muted">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
        <p>Verification protects buyers and makes sure payouts reach the right person. It takes about two minutes.</p>
      </div>
    </Dialog>
  );
}

export function ContentActionDialogs({ actions }: { actions: ContentActions }) {
  return (
    <>
      <PublishBlockedDialog message={actions.blockedMessage} onClose={actions.dismissBlocked} />
      <ConfirmDialog
        open={actions.pendingDelete !== null}
        title="Delete this video?"
        description={
          <>
            <strong className="font-medium text-fg">“{actions.pendingDelete?.title}”</strong> will be removed from your library and storefront. Past
            purchases and earnings stay in your reports.
          </>
        }
        confirmLabel="Delete video"
        pending={actions.deleting}
        onConfirm={actions.confirmDelete}
        onCancel={actions.cancelDelete}
      />
    </>
  );
}
