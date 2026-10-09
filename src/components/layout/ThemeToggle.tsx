"use client";

import { clsx } from "clsx";
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Label, Radio, RadioGroup } from "react-aria-components";
import { useHydrated } from "@/lib/use-hydrated";

const THEMES: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();

  return (
    <RadioGroup
      value={hydrated ? (theme ?? "system") : null}
      onChange={setTheme}
      orientation="horizontal"
      className={clsx("flex flex-col gap-1.5", className)}
    >
      <Label className="text-xs font-medium text-muted">Theme</Label>
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-subtle p-1">
        {THEMES.map(({ value, label, icon: Icon }) => (
          <Radio
            key={value}
            value={value}
            className={clsx(
              "flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md text-xs font-medium text-muted transition-colors outline-none sm:h-8",
              "hover:text-fg data-selected:bg-surface data-selected:text-fg data-selected:shadow-card",
              "data-focus-visible:outline-2 data-focus-visible:outline-ring",
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {label}
          </Radio>
        ))}
      </div>
    </RadioGroup>
  );
}
