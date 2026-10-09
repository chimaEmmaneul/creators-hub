"use client";

import { clsx } from "clsx";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  DateField,
  DateInput,
  DatePicker,
  DateSegment,
  Dialog,
  Group,
  Heading,
  Popover,
} from "react-aria-components";
import { getLocalTimeZone, now, parseAbsoluteToLocal, parseDate, type ZonedDateTime } from "@internationalized/date";
import { useHydrated } from "@/lib/use-hydrated";
import { AriaDescription, AriaFieldError, AriaLabel, fieldBoxClasses, popoverClasses } from "./aria-field";
import { Skeleton } from "./Skeleton";

const segmentClasses = clsx(
  "rounded px-0.5 tabular-nums outline-none caret-transparent",
  "data-placeholder:text-muted/70 data-[type=literal]:px-0 data-[type=literal]:text-muted",
  "data-focused:bg-accent data-focused:text-on-accent",
);

interface BaseProps {
  label: string;
  description?: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
}

export function MemorableDateField({ label, description, error, required, className, value, onChange }: BaseProps & { value: string; onChange: (value: string) => void }) {
  return (
    <DateField
      value={value ? parseDate(value) : null}
      onChange={(date) => onChange(date ? date.toString() : "")}
      isInvalid={Boolean(error)}
      isRequired={required}
      validationBehavior="aria"
      granularity="day"
      className={clsx("flex flex-col gap-1.5", className)}
    >
      <AriaLabel required={required}>{label}</AriaLabel>
      <DateInput className={clsx(fieldBoxClasses, "gap-0")}>{(segment) => <DateSegment segment={segment} className={segmentClasses} />}</DateInput>
      <AriaDescription>{description}</AriaDescription>
      <AriaFieldError>{error}</AriaFieldError>
    </DateField>
  );
}

interface Preset {
  label: string;
  resolve: () => ZonedDateTime;
}

const PRESETS: Preset[] = [
  { label: "In 1 hour", resolve: () => now(getLocalTimeZone()).add({ hours: 1 }).set({ second: 0, millisecond: 0 }) },
  { label: "Tomorrow, 9 AM", resolve: () => now(getLocalTimeZone()).add({ days: 1 }).set({ hour: 9, minute: 0, second: 0, millisecond: 0 }) },
  { label: "Next week", resolve: () => now(getLocalTimeZone()).add({ weeks: 1 }).set({ hour: 9, minute: 0, second: 0, millisecond: 0 }) },
];

export function DateTimeField({ label, description, error, required, className, value, onChange }: BaseProps & { value: string; onChange: (value: string) => void }) {
  const hydrated = useHydrated();
  if (!hydrated) return <Skeleton className="h-16 w-full max-w-sm" />;

  const toIso = (date: ZonedDateTime | null) => (date ? date.toDate().toISOString() : "");

  return (
    <div className={clsx("flex flex-col gap-2", className)}>
      <DatePicker
        value={value ? parseAbsoluteToLocal(value) : null}
        onChange={(date) => onChange(toIso(date))}
        minValue={now(getLocalTimeZone())}
        granularity="minute"
        hideTimeZone
        isInvalid={Boolean(error)}
        isRequired={required}
        validationBehavior="aria"
        className="group flex flex-col gap-1.5"
      >
        <AriaLabel required={required}>{label}</AriaLabel>
        <Group className={clsx(fieldBoxClasses, "pr-1")}>
          <DateInput className="flex min-w-0 flex-1 overflow-x-auto [scrollbar-width:none]">
            {(segment) => <DateSegment segment={segment} className={segmentClasses} />}
          </DateInput>
          <Button
            aria-label="Open calendar"
            className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-md text-muted outline-none hover:bg-subtle hover:text-fg data-focus-visible:outline-2 data-focus-visible:outline-ring sm:size-8"
          >
            <CalendarDays className="size-4" aria-hidden="true" />
          </Button>
        </Group>
        <AriaDescription>{description}</AriaDescription>
        <AriaFieldError>{error}</AriaFieldError>
        <Popover className={popoverClasses} placement="bottom start" offset={6}>
          <Dialog className="p-3 outline-none">
            <CalendarPanel />
          </Dialog>
        </Popover>
      </DatePicker>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Quick picks">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onChange(toIso(preset.resolve()))}
            className="h-9 rounded-full border border-line-strong px-3 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-fg sm:h-7"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const navButtonClasses =
  "grid size-9 cursor-pointer place-items-center rounded-lg text-muted outline-none hover:bg-subtle hover:text-fg data-focus-visible:outline-2 data-focus-visible:outline-ring data-disabled:opacity-30";

function CalendarPanel() {
  return (
    <Calendar className="w-[17.5rem]">
      <header className="mb-2 flex items-center justify-between">
        <Button slot="previous" className={navButtonClasses}>
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Button>
        <Heading className="text-sm font-semibold text-fg" />
        <Button slot="next" className={navButtonClasses}>
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </header>
      <CalendarGrid className="w-full border-separate border-spacing-0.5 [&_th]:pb-1 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted">
        {(date) => (
          <CalendarCell
            date={date}
            className={clsx(
              "grid size-9 cursor-pointer place-items-center rounded-lg text-sm tabular-nums text-fg outline-none",
              "hover:bg-subtle data-outside-month:invisible data-disabled:cursor-default data-disabled:text-muted/40 data-disabled:hover:bg-transparent",
              "data-selected:bg-accent data-selected:text-on-accent data-focus-visible:outline-2 data-focus-visible:outline-ring",
              "[&[data-today]:not([data-selected])]:font-bold [&[data-today]:not([data-selected])]:text-accent",
            )}
          />
        )}
      </CalendarGrid>
    </Calendar>
  );
}
