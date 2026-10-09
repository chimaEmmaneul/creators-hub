"use client";

import { clsx } from "clsx";
import { useState, type DragEvent, type ReactNode } from "react";
import type { ControlProps } from "./FormField";

interface FileDropzoneProps {
  control: ControlProps;
  accept: string;
  onFile: (file: File) => void;
  icon: ReactNode;
  title: ReactNode;
  hint: ReactNode;
  disabled?: boolean;
  capture?: "user" | "environment";
  className?: string;
}

export function FileDropzone({ control, accept, onFile, icon, title, hint, disabled, capture, className }: FileDropzoneProps) {
  const [dragging, setDragging] = useState(false);

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file && !disabled) onFile(file);
  }

  return (
    <label
      htmlFor={control.id}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={clsx(
        "group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors",
        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
        dragging ? "border-accent bg-accent-soft" : "border-line-strong bg-subtle/40 hover:border-accent/60 hover:bg-subtle",
        control["aria-invalid"] && "border-danger",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
    >
      <input
        {...control}
        type="file"
        accept={accept}
        capture={capture}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = "";
        }}
      />
      <span className="grid size-12 place-items-center rounded-full bg-surface text-accent shadow-card transition-transform group-hover:scale-105" aria-hidden="true">
        {icon}
      </span>
      <span className="text-sm font-medium text-fg">{title}</span>
      <span className="text-xs text-muted">{hint}</span>
    </label>
  );
}
