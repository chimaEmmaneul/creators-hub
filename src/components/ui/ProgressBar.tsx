import { clsx } from "clsx";

interface ProgressBarProps {
  value: number;
  label: string;
  tone?: "accent" | "success" | "danger";
  className?: string;
}

const TONE: Record<NonNullable<ProgressBarProps["tone"]>, string> = {
  accent: "bg-accent",
  success: "bg-success",
  danger: "bg-danger",
};

export function ProgressBar({ value, label, tone = "accent", className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className={clsx("h-1.5 w-full overflow-hidden rounded-full bg-line", className)}
    >
      <div className={clsx("h-full rounded-full transition-[width] duration-300 ease-out", TONE[tone])} style={{ width: `${clamped}%` }} />
    </div>
  );
}
