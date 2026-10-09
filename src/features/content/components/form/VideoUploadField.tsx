"use client";

import { CheckCircle2, FileVideo, RotateCw, UploadCloud, X } from "lucide-react";
import { formatFileSize } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { FileDropzone } from "@/components/ui/FileDropzone";
import { FormField } from "@/components/ui/FormField";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { UploadState } from "../../hooks/use-simulated-upload";
import { VIDEO_ACCEPT } from "../../lib/media";

interface VideoUploadFieldProps {
  state: UploadState;
  error?: string;
  onSelect: (file: File) => void;
  onRetry: () => void;
  onCancel: () => void;
}

export function VideoUploadField({ state, error, onSelect, onRetry, onCancel }: VideoUploadFieldProps) {
  return (
    <FormField label="Video file" required error={error} hint="MP4, MOV or WebM up to 5 GB. Uploading starts right away, so keep filling in the details.">
      {(control) =>
        state.status === "idle" ? (
          <FileDropzone
            control={control}
            accept={VIDEO_ACCEPT}
            onFile={onSelect}
            icon={<UploadCloud className="size-6" />}
            title={
              <>
                <span className="text-accent">Choose a video</span> or drag it here
              </>
            }
            hint="Your upload continues while you edit the rest of the form"
          />
        ) : (
          <div className="rounded-xl border border-line bg-surface p-4" aria-live="polite">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent-soft-fg" aria-hidden="true">
                <FileVideo className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg">{state.file.fileName}</p>
                <p className="text-xs text-muted">
                  {formatFileSize(state.file.sizeBytes)}
                  {state.status === "uploading" && <> · Uploading {state.progress}%</>}
                  {state.status === "complete" && (
                    <span className="ml-1 inline-flex items-center gap-1 text-success">
                      <CheckCircle2 className="size-3.5" aria-hidden="true" /> Upload complete
                    </span>
                  )}
                </p>
              </div>
              <Button
                id={control.id}
                aria-describedby={control["aria-describedby"]}
                variant="ghost"
                size={state.status === "complete" ? "sm" : "icon"}
                onClick={onCancel}
                aria-label={state.status === "complete" ? `Replace ${state.file.fileName}` : `Cancel upload of ${state.file.fileName}`}
              >
                {state.status === "complete" ? "Replace" : <X className="size-4" aria-hidden="true" />}
              </Button>
            </div>

            {state.status === "uploading" && <ProgressBar className="mt-3" value={state.progress} label={`Uploading ${state.file.fileName}`} />}

            {state.status === "error" && (
              <div className="mt-3 flex flex-col gap-3">
                <ProgressBar value={state.progress} tone="danger" label={`Upload paused at ${state.progress}%`} />
                <div role="alert" className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-danger">{state.message}</span>
                  <Button variant="secondary" size="sm" onClick={onRetry}>
                    <RotateCw className="size-4" aria-hidden="true" />
                    Resume upload
                  </Button>
                </div>
              </div>
            )}
          </div>
        )
      }
    </FormField>
  );
}
