"use client";

import { CalendarClock, FileText, Lock, Rocket } from "lucide-react";
import type { ContentStatus } from "@/types";
import { DateTimeField } from "@/components/ui/DateFields";
import { RadioCardGroup, type RadioCardOption } from "@/components/ui/RadioCardGroup";

const LOCKED_NOTE = (
  <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-warning">
    <Lock className="size-3" aria-hidden="true" />
    Requires verification
  </span>
);

function visibilityOptions(canPublish: boolean): RadioCardOption<ContentStatus>[] {
  const note = canPublish ? undefined : LOCKED_NOTE;
  return [
    { value: "DRAFT", label: "Save as draft", description: "Only you can see it", icon: FileText },
    { value: "PUBLISHED", label: "Publish now", description: "Goes on sale immediately", icon: Rocket, note },
    { value: "SCHEDULED", label: "Schedule", description: "Goes live at a set time", icon: CalendarClock, note },
  ];
}

interface PublishOptionsFieldProps {
  status: ContentStatus;
  scheduledAt: string;
  canPublish: boolean;
  statusError?: string;
  scheduleError?: string;
  onStatusChange: (status: ContentStatus) => void;
  onScheduleChange: (value: string) => void;
}

export function PublishOptionsField({ status, scheduledAt, canPublish, statusError, scheduleError, onStatusChange, onScheduleChange }: PublishOptionsFieldProps) {
  return (
    <div className="flex flex-col gap-4">
      <RadioCardGroup legend="Visibility" options={visibilityOptions(canPublish)} value={status} onChange={onStatusChange} error={statusError} />
      {status === "SCHEDULED" && (
        <DateTimeField
          label="Go-live date and time"
          required
          value={scheduledAt}
          onChange={onScheduleChange}
          error={scheduleError}
          description="In your local time zone."
        />
      )}
    </div>
  );
}
