import { clsx } from "clsx";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={clsx("animate-shimmer rounded-md bg-subtle", className)} />;
}

export function LoadingRegion({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
