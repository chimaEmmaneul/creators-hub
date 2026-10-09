"use client";

import { useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FileDropzone } from "@/components/ui/FileDropzone";
import { FormField } from "@/components/ui/FormField";
import { Spinner } from "@/components/ui/Spinner";
import { Thumbnail } from "@/components/ui/Thumbnail";
import { createThumbnailDataUrl, IMAGE_ACCEPT, validateImageFile } from "../../lib/media";

interface ThumbnailFieldProps {
  value: string | null;
  error?: string;
  onChange: (value: string | null) => void;
  onError: (message: string) => void;
}

export function ThumbnailField({ value, error, onChange, onError }: ThumbnailFieldProps) {
  const [processing, setProcessing] = useState(false);

  async function handleFile(file: File) {
    const problem = validateImageFile(file);
    if (problem) return onError(problem);
    setProcessing(true);
    try {
      onChange(await createThumbnailDataUrl(file));
    } catch {
      onError("We couldn't read that image. Try a different file.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <FormField label="Thumbnail" error={error} hint="Shown in your storefront. Cropped to 16:9; 1280×720 or larger looks best.">
      {(control) =>
        value ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Thumbnail src={value} alt="Selected thumbnail preview" sizes="(max-width: 640px) 100vw, 320px" className="w-full sm:w-80" />
            <Button id={control.id} aria-describedby={control["aria-describedby"]} variant="secondary" size="sm" onClick={() => onChange(null)}>
              <Trash2 className="size-4" aria-hidden="true" />
              Remove thumbnail
            </Button>
          </div>
        ) : (
          <FileDropzone
            control={control}
            accept={IMAGE_ACCEPT}
            onFile={handleFile}
            disabled={processing}
            icon={processing ? <Spinner className="size-5" /> : <ImagePlus className="size-6" />}
            title={processing ? "Preparing preview…" : <><span className="text-accent">Choose an image</span> or drag it here</>}
            hint="JPG, PNG or WebP up to 10 MB"
          />
        )
      }
    </FormField>
  );
}
