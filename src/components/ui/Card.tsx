import { clsx } from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("rounded-xl border border-line bg-surface shadow-card", className)} {...props} />;
}

interface SectionCardProps {
  title: string;
  titleId: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ title, titleId, description, actions, children, className }: SectionCardProps) {
  return (
    <section aria-labelledby={titleId} className={clsx("rounded-xl border border-line bg-surface shadow-card", className)}>
      <header className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <h2 id={titleId} className="text-base font-semibold text-fg">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      {children}
    </section>
  );
}
