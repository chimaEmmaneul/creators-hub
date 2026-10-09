"use client";

import { clsx } from "clsx";
import { Check } from "lucide-react";

interface StepperProps {
  steps: readonly string[];
  current: number;
  completed: number;
  onSelect: (step: number) => void;
}

export function Stepper({ steps, current, completed, onSelect }: StepperProps) {
  return (
    <nav aria-label="Verification progress">
      <ol className="flex items-start gap-2">
        {steps.map((label, index) => {
          const step = index + 1;
          const isCurrent = step === current;
          const isDone = step <= completed && !isCurrent;
          const reachable = step <= completed + 1 && !isCurrent;
          const state = isCurrent ? "current step" : isDone ? "completed" : "not started";

          const marker = (
            <>
              <span
                aria-hidden="true"
                className={clsx(
                  "grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold transition-colors",
                  isCurrent && "bg-accent text-on-accent ring-4 ring-accent-soft",
                  isDone && "bg-success text-white dark:text-bg",
                  !isCurrent && !isDone && "border border-line-strong bg-surface text-muted",
                )}
              >
                {isDone ? <Check className="size-4" strokeWidth={3} /> : step}
              </span>
              <span className={clsx("text-center text-xs leading-tight font-medium", isCurrent ? "text-fg" : "text-muted", !isCurrent && "max-sm:sr-only")}>
                {label}
                <span className="sr-only">, {state}</span>
              </span>
            </>
          );

          return (
            <li key={label} aria-current={isCurrent ? "step" : undefined} className="relative flex flex-1 flex-col items-center gap-2">
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={clsx("absolute top-4 left-[calc(50%+1.25rem)] h-0.5 w-[calc(100%-2.5rem)] rounded-full", step <= completed ? "bg-success" : "bg-line")}
                />
              )}
              {reachable ? (
                <button type="button" onClick={() => onSelect(step)} className="flex flex-col items-center gap-2 rounded-lg p-1">
                  {marker}
                </button>
              ) : (
                <div className="flex flex-col items-center gap-2 p-1">{marker}</div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
