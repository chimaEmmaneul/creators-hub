import Link from "next/link";
import { clsx } from "clsx";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "icon";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-on-accent shadow-card hover:bg-accent-hover",
  secondary: "bg-surface text-fg border border-line-strong shadow-card hover:bg-subtle",
  ghost: "text-muted hover:bg-subtle hover:text-fg",
  danger: "bg-danger text-white shadow-card hover:bg-danger-hover dark:text-bg",
};

const SIZES: Record<Size, string> = {
  sm: "h-11 sm:h-8 px-3 text-sm gap-1.5",
  md: "h-11 sm:h-10 px-4 text-sm gap-2",
  icon: "size-11 sm:size-9",
};

interface StyleProps {
  variant?: Variant;
  size?: Size;
  className?: string;
}

export function buttonClasses({ variant = "primary", size = "md", className }: StyleProps = {}) {
  return clsx(
    "inline-flex shrink-0 items-center justify-center rounded-lg font-medium whitespace-nowrap select-none",
    "transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  StyleProps & {
    loading?: boolean;
  };

export function Button({ variant, size, className, loading = false, disabled, children, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}

export function ButtonLink({ variant, size, className, ...props }: ComponentProps<typeof Link> & StyleProps) {
  return <Link className={buttonClasses({ variant, size, className })} {...props} />;
}
