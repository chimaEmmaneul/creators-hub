"use client";

import { useEffect, useRef, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface StepFrameProps {
  step: number;
  totalSteps: number;
  title: string;
  description: ReactNode;
  children: ReactNode;
  submitLabel: string;
  pending: boolean;
  error?: string | null;
  onSubmit: () => boolean;
  onBack?: () => void;
  focusOnMount: boolean;
}

export function StepFrame({ step, totalSteps, title, description, children, submitLabel, pending, error, onSubmit, onBack, focusOnMount }: StepFrameProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (focusOnMount) headingRef.current?.focus();
  }, [focusOnMount]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (onSubmit()) return;
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
  }

  return (
    <form ref={formRef} noValidate onSubmit={handleSubmit} className="flex flex-col gap-6 animate-fade-in">
      <div>
        <p className="text-xs font-medium tracking-wide text-accent uppercase">
          Step {step} of {totalSteps}
        </p>
        <h2 ref={headingRef} tabIndex={-1} className="mt-1 text-xl font-semibold text-fg outline-none">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted text-pretty">{description}</p>
      </div>

      {children}

      {error && (
        <div role="alert" className="flex gap-2 rounded-lg bg-danger-soft p-3 text-sm text-danger">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        {onBack ? (
          <Button variant="ghost" onClick={onBack} disabled={pending}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </Button>
        ) : (
          <span />
        )}
        <div className="flex flex-col-reverse items-center gap-2 sm:flex-row sm:gap-4">
          <Link href="/" className="rounded text-sm font-medium text-muted hover:text-fg">
            Finish later
          </Link>
          <Button type="submit" loading={pending} className="w-full sm:w-auto">
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
