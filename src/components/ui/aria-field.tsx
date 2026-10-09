"use client";

import { clsx } from "clsx";
import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";
import { FieldError, Label, Text } from "react-aria-components";

export function AriaLabel({ children, required, hidden }: { children: ReactNode; required?: boolean; hidden?: boolean }) {
  return (
    <Label className={hidden ? "sr-only" : "text-sm font-medium text-fg"}>
      {children}
      {required && (
        <span className="text-danger" aria-hidden="true">
          {" "}*
        </span>
      )}
    </Label>
  );
}

export function AriaDescription({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <Text slot="description" className="text-xs text-muted">
      {children}
    </Text>
  );
}

export function AriaFieldError({ children }: { children?: ReactNode }) {
  return (
    <FieldError className="inline-flex items-center gap-1 text-xs font-medium text-danger">
      <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
      {children}
    </FieldError>
  );
}

export const fieldBoxClasses = clsx(
  "flex h-11 w-full items-center gap-2 rounded-lg border border-line-strong bg-surface px-3 text-base text-fg shadow-card transition-colors sm:h-10 sm:text-sm",
  "hover:border-muted/60",
  "data-focus-visible:border-accent data-focus-visible:outline-2 data-focus-visible:outline-ring",
  "data-focus-within:border-accent",
  "data-invalid:border-danger data-disabled:cursor-not-allowed data-disabled:bg-subtle data-disabled:text-muted",
);

export const popoverClasses = clsx(
  "min-w-(--trigger-width) overflow-hidden rounded-xl border border-line bg-surface text-fg shadow-pop outline-none",
  "data-entering:animate-scale-in data-exiting:animate-fade-in data-exiting:[animation-direction:reverse]",
);

export const listBoxClasses = "max-h-72 overflow-y-auto p-1 outline-none";

export const listItemClasses = clsx(
  "group flex min-h-11 cursor-default items-center gap-2.5 rounded-lg px-2.5 text-sm text-fg outline-none select-none sm:min-h-9",
  "data-focused:bg-subtle data-selected:font-medium data-disabled:opacity-50",
);
