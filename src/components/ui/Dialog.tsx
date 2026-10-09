"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  dismissible?: boolean;
}

export function Dialog({ open, onClose, title, description, children, footer, dismissible = true }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocusTo = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocusTo.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
      returnFocusTo.current?.focus();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        if (dismissible) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && dismissible) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-line bg-surface p-0 text-fg shadow-pop open:animate-scale-in"
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold text-balance">
            {title}
          </h2>
          <Button variant="ghost" size="icon" className="-mt-2 -mr-2" onClick={onClose} disabled={!dismissible} aria-label="Close dialog">
            <X className="size-5" aria-hidden="true" />
          </Button>
        </div>
        {description && (
          <div id={descriptionId} className="mt-2 text-sm text-muted text-pretty">
            {description}
          </div>
        )}
        {children && <div className="mt-4">{children}</div>}
      </div>
      {footer && (
        <div className="flex flex-col-reverse gap-2 border-t border-line bg-subtle/50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          {footer}
        </div>
      )}
    </dialog>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending?: boolean;
  tone?: "danger" | "primary";
}

export function ConfirmDialog({ open, title, description, confirmLabel, onConfirm, onCancel, pending = false, tone = "danger" }: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      dismissible={!pending}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={pending} data-autofocus>
            Cancel
          </Button>
          <Button variant={tone} onClick={onConfirm} loading={pending}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
