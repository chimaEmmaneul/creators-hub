"use client";

import { clsx } from "clsx";
import { useId, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { FieldError } from "./FormField";

export interface RadioCardOption<Value extends string> {
  value: Value;
  label: string;
  description?: string;
  icon: LucideIcon;
  note?: ReactNode;
}

interface RadioCardGroupProps<Value extends string> {
  legend: string;
  options: readonly RadioCardOption<Value>[];
  value: Value | null;
  onChange: (value: Value) => void;
  error?: string;
  className?: string;
}

export function RadioCardGroup<Value extends string>({ legend, options, value, onChange, error, className }: RadioCardGroupProps<Value>) {
  const name = useId();
  const errorId = useId();
  return (
    <fieldset aria-describedby={error ? errorId : undefined} className="min-w-0">
      <legend className="mb-1.5 text-sm font-medium text-fg">{legend}</legend>
      <div className={clsx("grid gap-2", className)}>
        {options.map(({ value: optionValue, label, description, icon: Icon, note }) => (
          <label key={optionValue} className="relative">
            <input
              type="radio"
              name={name}
              value={optionValue}
              checked={value === optionValue}
              onChange={() => onChange(optionValue)}
              className="peer sr-only"
            />
            <span
              className={clsx(
                "flex h-full cursor-pointer flex-col gap-1 rounded-xl border p-3.5 transition-colors",
                "border-line-strong hover:bg-subtle peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:ring-1 peer-checked:ring-accent",
                "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
                error && "border-danger",
              )}
            >
              <span className="flex items-center gap-2 text-sm font-medium text-fg">
                <Icon className="size-4 text-accent" aria-hidden="true" />
                {label}
              </span>
              {description && <span className="text-xs text-muted">{description}</span>}
              {note}
            </span>
          </label>
        ))}
      </div>
      <FieldError id={errorId} message={error} />
    </fieldset>
  );
}
