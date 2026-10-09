"use client";

import { useState } from "react";
import { Check, Circle, Eye, EyeOff } from "lucide-react";
import { clsx } from "clsx";
import { PASSWORD_MIN_LENGTH } from "@/lib/schemas";
import { FormField, Input } from "@/components/ui/FormField";

const REQUIREMENTS = [
  { label: `At least ${PASSWORD_MIN_LENGTH} characters`, test: (value: string) => value.length >= PASSWORD_MIN_LENGTH },
  { label: "A letter and a number", test: (value: string) => /[a-zA-Z]/.test(value) && /\d/.test(value) },
];

interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete: "current-password" | "new-password";
}

export function PasswordField({ value, onChange, error, autoComplete }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const isNew = autoComplete === "new-password";

  return (
    <FormField label="Password" required error={error}>
      {(control) => (
        <>
          <div className="relative">
            <Input
              {...control}
              type={visible ? "text" : "password"}
              autoComplete={autoComplete}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setVisible((current) => !current)}
              aria-label={visible ? "Hide password" : "Show password"}
              aria-pressed={visible}
              className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-muted hover:text-fg"
            >
              {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
            </button>
          </div>
          {isNew && (
            <ul className="mt-1 flex flex-col gap-1 text-xs" aria-label="Password requirements">
              {REQUIREMENTS.map(({ label, test }) => {
                const met = test(value);
                return (
                  <li key={label} className={clsx("flex items-center gap-1.5", met ? "text-success" : "text-muted")}>
                    {met ? <Check className="size-3.5" aria-hidden="true" /> : <Circle className="size-3.5" aria-hidden="true" />}
                    {label}
                    <span className="sr-only">{met ? "(met)" : "(not yet met)"}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </FormField>
  );
}
