import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface PanelProps {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  tone?: "neutral" | "danger";
  className?: string;
  role?: "alert";
}

export function StatePanel({ icon: Icon, title, description, action, tone = "neutral", className, role }: PanelProps) {
  return (
    <div role={role} className={clsx("flex flex-col items-center px-6 py-12 text-center animate-fade-in", className)}>
      <span
        className={clsx(
          "mb-4 grid size-12 place-items-center rounded-full",
          tone === "danger" ? "bg-danger-soft text-danger" : "bg-accent-soft text-accent-soft-fg",
        )}
      >
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <p className="text-base font-semibold text-fg">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted text-pretty">{description}</p>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function EmptyState(props: Omit<PanelProps, "tone" | "role">) {
  return <StatePanel {...props} />;
}
