"use client";

import { clsx } from "clsx";
import { Check, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { Button, ListBox, ListBoxItem, Popover, Select as AriaSelect, SelectValue } from "react-aria-components";
import { AriaDescription, AriaFieldError, AriaLabel, fieldBoxClasses, listBoxClasses, listItemClasses, popoverClasses } from "./aria-field";

export interface SelectOption<Value extends string> {
  value: Value;
  label: string;
  description?: string;
  icon?: ReactNode;
}

interface SelectProps<Value extends string> {
  label: string;
  hideLabel?: boolean;
  options: readonly SelectOption<Value>[];
  value: Value | null;
  onChange: (value: Value) => void;
  placeholder?: string;
  description?: ReactNode;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Select<Value extends string>({
  label,
  hideLabel,
  options,
  value,
  onChange,
  placeholder = "Select…",
  description,
  error,
  required,
  disabled,
  className,
}: SelectProps<Value>) {
  return (
    <AriaSelect
      value={value}
      onChange={(key) => key !== null && onChange(key as Value)}
      placeholder={placeholder}
      isInvalid={Boolean(error)}
      isRequired={required}
      isDisabled={disabled}
      validationBehavior="aria"
      className={clsx("group flex flex-col gap-1.5", className)}
    >
      <AriaLabel required={required} hidden={hideLabel}>
        {label}
      </AriaLabel>
      <Button className={clsx(fieldBoxClasses, "cursor-pointer justify-between text-left outline-none")}>
        <SelectValue className="flex min-w-0 items-center gap-2 truncate data-placeholder:text-muted">
          {({ selectedItem, defaultChildren }) => {
            const option = options.find((candidate) => candidate.value === (selectedItem as SelectOption<Value> | null)?.value);
            return option ? (
              <>
                {option.icon}
                <span className="truncate">{option.label}</span>
              </>
            ) : (
              defaultChildren
            );
          }}
        </SelectValue>
        <ChevronDown className="size-4 shrink-0 text-muted transition-transform group-data-open:rotate-180" aria-hidden="true" />
      </Button>
      <AriaDescription>{description}</AriaDescription>
      <AriaFieldError>{error}</AriaFieldError>
      <Popover className={popoverClasses} offset={6}>
        <ListBox items={options.map((option) => ({ ...option, id: option.value }))} className={listBoxClasses}>
          {(option) => (
            <ListBoxItem id={option.value} textValue={option.label} className={listItemClasses}>
              {({ isSelected }) => (
                <>
                  {option.icon && <span className="shrink-0">{option.icon}</span>}
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{option.label}</span>
                    {option.description && <span className="truncate text-xs font-normal text-muted">{option.description}</span>}
                  </span>
                  <Check className={clsx("size-4 shrink-0 text-accent", !isSelected && "invisible")} aria-hidden="true" />
                </>
              )}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
}
