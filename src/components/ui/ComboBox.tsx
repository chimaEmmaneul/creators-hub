"use client";

import { clsx } from "clsx";
import { Check, ChevronsUpDown, SearchX } from "lucide-react";
import type { ReactNode } from "react";
import { Button, ComboBox as AriaComboBox, Group, Input, ListBox, ListBoxItem, Popover } from "react-aria-components";
import { AriaDescription, AriaFieldError, AriaLabel, fieldBoxClasses, listBoxClasses, listItemClasses, popoverClasses } from "./aria-field";

export interface ComboBoxOption<Value extends string> {
  value: Value;
  label: string;
  keywords?: string;
  icon?: ReactNode;
}

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

interface ComboBoxProps<Value extends string> {
  label: string;
  options: readonly ComboBoxOption<Value>[];
  value: Value | null;
  onChange: (value: Value | null) => void;
  placeholder?: string;
  description?: ReactNode;
  error?: string;
  required?: boolean;
  emptyMessage?: string;
  className?: string;
  autoComplete?: string;
}

export function ComboBox<Value extends string>({
  label,
  options,
  value,
  onChange,
  placeholder,
  description,
  error,
  required,
  emptyMessage = "No matches",
  className,
  autoComplete,
}: ComboBoxProps<Value>) {
  const selected = options.find((option) => option.value === value);
  const searchable = new Map(options.map((option) => [option.label, normalize(`${option.label} ${option.keywords ?? ""}`)]));
  const filter = (textValue: string, inputValue: string) => (searchable.get(textValue) ?? normalize(textValue)).includes(normalize(inputValue));
  return (
    <AriaComboBox
      value={value}
      onChange={(key) => onChange((key as Value | null) ?? null)}
      defaultItems={options.map((option) => ({ ...option, id: option.value }))}
      defaultFilter={filter}
      isInvalid={Boolean(error)}
      isRequired={required}
      validationBehavior="aria"
      menuTrigger="focus"
      className={clsx("group flex flex-col gap-1.5", className)}
    >
      <AriaLabel required={required}>{label}</AriaLabel>
      <Group className={clsx(fieldBoxClasses, "pr-1")}>
        {selected?.icon && <span className="shrink-0">{selected.icon}</span>}
        <Input placeholder={placeholder} autoComplete={autoComplete} className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted/70" />
        <Button aria-label="Show options" className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-md text-muted outline-none hover:bg-subtle data-focus-visible:outline-2 data-focus-visible:outline-ring sm:size-8">
          <ChevronsUpDown className="size-4" aria-hidden="true" />
        </Button>
      </Group>
      <AriaDescription>{description}</AriaDescription>
      <AriaFieldError>{error}</AriaFieldError>
      <Popover className={popoverClasses} offset={6}>
        <ListBox
          className={listBoxClasses}
          renderEmptyState={() => (
            <p className="flex items-center gap-2 px-3 py-4 text-sm text-muted">
              <SearchX className="size-4" aria-hidden="true" />
              {emptyMessage}
            </p>
          )}
        >
          {(option: ComboBoxOption<Value> & { id: Value }) => (
            <ListBoxItem id={option.value} textValue={option.label} className={listItemClasses}>
              {({ isSelected }) => (
                <>
                  {option.icon && <span className="shrink-0">{option.icon}</span>}
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  <Check className={clsx("size-4 shrink-0 text-accent", !isSelected && "invisible")} aria-hidden="true" />
                </>
              )}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </AriaComboBox>
  );
}
