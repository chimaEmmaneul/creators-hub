import { clsx } from "clsx";
import { CalendarClock, CheckCircle2, CircleDashed, Clock3, XCircle, type LucideIcon } from "lucide-react";
import type { Tone } from "@/lib/status-meta";

const TONES: Record<Tone, { className: string; Icon: LucideIcon }> = {
  success: { className: "bg-success-soft text-success", Icon: CheckCircle2 },
  info: { className: "bg-info-soft text-info", Icon: CalendarClock },
  warning: { className: "bg-warning-soft text-warning", Icon: Clock3 },
  danger: { className: "bg-danger-soft text-danger", Icon: XCircle },
  neutral: { className: "bg-subtle text-muted", Icon: CircleDashed },
};

export function StatusBadge({ label, tone, className }: { label: string; tone: Tone; className?: string }) {
  const { className: toneClass, Icon } = TONES[tone];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full py-0.5 pr-2 pl-1.5 text-xs font-medium whitespace-nowrap",
        toneClass,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
