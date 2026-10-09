"use client";

import { clsx } from "clsx";
import { AlertCircle } from "lucide-react";
import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";

export interface ControlProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  "aria-required"?: true;
}

interface FormFieldProps {
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  aside?: ReactNode;
  className?: string;
  children: (control: ControlProps) => ReactNode;
}

export function FormField({ label, hint, error, required, aside, className, children }: FormFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-fg">
          {label}
          {required && (
            <span className="text-danger" aria-hidden="true">
              {" "}*
            </span>
          )}
        </label>
        {aside}
      </div>
      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        "aria-required": required ? true : undefined,
      })}
      {hint && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
      <FieldError id={errorId} message={error} />
    </div>
  );
}

export function FieldError({ id, message }: { id?: string; message?: string }) {
  return (
    <p id={id} aria-live="polite" className="text-xs font-medium text-danger empty:hidden">
      {message && (
        <span className="inline-flex items-center gap-1">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          {message}
        </span>
      )}
    </p>
  );
}

export const controlClasses = clsx(
  "w-full rounded-lg border border-line-strong bg-surface px-3 text-base text-fg shadow-card sm:text-sm",
  "placeholder:text-muted/70 transition-colors",
  "hover:border-muted/60 focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-0",
  "disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted",
  "aria-invalid:border-danger aria-invalid:focus-visible:outline-danger",
);

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx(controlClasses, "h-11 sm:h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={clsx(controlClasses, "min-h-28 resize-y py-2.5", className)} {...props} />;
}
