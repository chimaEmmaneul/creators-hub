"use client";

import { clsx } from "clsx";
import { useId } from "react";

export interface SegmentOption<Value extends string> {
  value: Value;
  label: string;
  badge?: number;
}

interface SegmentedControlProps<Value extends string> {
  legend: string;
  hideLegend?: boolean;
  options: readonly SegmentOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  className?: string;
}

export function SegmentedControl<Value extends string>({ legend, hideLegend = true, options, value, onChange, className }: SegmentedControlProps<Value>) {
  const name = useId();
  return (
    <fieldset className={clsx("min-w-0", className)}>
      <legend className={hideLegend ? "sr-only" : "mb-1.5 text-sm font-medium text-fg"}>{legend}</legend>
      <div className="flex max-w-full overflow-x-auto rounded-lg bg-subtle p-1 [scrollbar-width:none] max-sm:w-full">
        {options.map((option) => (
          <label key={option.value} className="relative shrink-0 max-sm:flex-1">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span
              className={clsx(
                "flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2.5 text-sm sm:px-3 font-medium whitespace-nowrap text-muted transition-colors sm:h-8",
                "hover:text-fg peer-checked:bg-surface peer-checked:text-fg peer-checked:shadow-card",
                "peer-focus-visible:outline-2 peer-focus-visible:outline-ring",
              )}
            >
              {option.label}
              {option.badge !== undefined && (
                <span className="rounded-full bg-line px-1.5 text-xs tabular-nums text-muted max-sm:hidden">{option.badge}</span>
              )}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
