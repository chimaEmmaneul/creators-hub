"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { isApiError } from "@/lib/api-client";
import { centsToDollarInput, dollarsToCents, formatDateTime } from "@/lib/format";
import { createContentSchema, firstFieldErrors, toFieldErrors, updateContentSchema, type VideoMetadata } from "@/lib/schemas";
import type { ContentItem, ContentStatus } from "@/types";
import { saveCalls, useSaveContent } from "./use-content-mutations";
import { useSimulatedUpload, type UploadState } from "./use-simulated-upload";

export interface ContentFormValues {
  title: string;
  description: string;
  price: string;
  thumbnailUrl: string | null;
  status: ContentStatus;
  scheduledAt: string;
}

export type FormErrors = Partial<Record<keyof ContentFormValues | "video", string>>;

const EMPTY_VALUES: ContentFormValues = { title: "", description: "", price: "", thumbnailUrl: null, status: "DRAFT", scheduledAt: "" };

function valuesFrom(item?: ContentItem): ContentFormValues {
  if (!item) return EMPTY_VALUES;
  return {
    title: item.title,
    description: item.description,
    price: centsToDollarInput(item.priceCents),
    thumbnailUrl: item.thumbnailUrl,
    status: item.status,
    scheduledAt: item.scheduledAt ?? "",
  };
}

function initialUpload(item?: ContentItem): UploadState {
  return item ? { status: "complete", file: { fileName: item.videoFileName, sizeBytes: item.videoSizeBytes } } : { status: "idle" };
}

const VIDEO_STATE_ERRORS: Record<Exclude<UploadState["status"], "complete">, string> = {
  idle: "Add a video file",
  uploading: "Your video is still uploading. You can submit once it finishes.",
  error: "Resume the upload to continue",
};

const SUCCESS_MESSAGES: Record<ContentStatus, (item: ContentItem) => string> = {
  DRAFT: () => "Draft saved",
  PUBLISHED: () => "Your video is live",
  SCHEDULED: (item) => `Scheduled for ${formatDateTime(item.scheduledAt ?? "")}`,
};

function toFormErrors(fieldErrors: Record<string, string[] | undefined>): FormErrors {
  const { priceCents, ...rest } = firstFieldErrors(fieldErrors);
  return { ...rest, ...(priceCents && { price: priceCents }) };
}

function validate(payload: unknown, item?: ContentItem): { errors: FormErrors } | { save: () => Promise<ContentItem> } {
  if (item) {
    const parsed = updateContentSchema.safeParse(payload);
    return parsed.success ? { save: saveCalls.update(item.id, parsed.data) } : { errors: toFormErrors(toFieldErrors(parsed.error)) };
  }
  const parsed = createContentSchema.safeParse(payload);
  return parsed.success ? { save: saveCalls.create(parsed.data) } : { errors: toFormErrors(toFieldErrors(parsed.error)) };
}

interface SubmitOptions {
  status?: ContentStatus;
  redirectTo?: string;
}

export function useContentForm(item?: ContentItem) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState(() => valuesFrom(item));
  const [errors, setErrors] = useState<FormErrors>({});
  const [focusRequest, setFocusRequest] = useState(0);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const upload = useSimulatedUpload(initialUpload(item));

  useEffect(() => {
    if (focusRequest) formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [focusRequest]);

  const mutation = useSaveContent();

  const guardActive = dirty && !mutation.isSuccess;
  useEffect(() => {
    if (!guardActive) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [guardActive]);

  function setField<Key extends keyof ContentFormValues>(key: Key, value: ContentFormValues[Key]) {
    setDirty(true);
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function setFieldError(field: keyof FormErrors, message: string) {
    setErrors((current) => ({ ...current, [field]: message }));
  }

  function selectVideo(file: File, validate: (file: File) => string | null) {
    const problem = validate(file);
    if (problem) return setFieldError("video", problem);
    setDirty(true);
    setErrors((current) => ({ ...current, video: undefined }));
    upload.start(file);
  }

  function videoPayload(): { video: VideoMetadata | null; error?: string } {
    const state = upload.state;
    if (state.status !== "complete") return { video: null, error: VIDEO_STATE_ERRORS[state.status] };
    const unchanged = item && state.file.fileName === item.videoFileName && state.file.sizeBytes === item.videoSizeBytes;
    return { video: unchanged ? null : state.file };
  }

  function submit({ status = values.status, redirectTo }: SubmitOptions = {}) {
    setServerError(null);
    const { video, error: videoError } = videoPayload();
    const payload = {
      title: values.title,
      description: values.description,
      priceCents: dollarsToCents(values.price),
      thumbnailUrl: values.thumbnailUrl,
      status,
      scheduledAt: status === "SCHEDULED" && values.scheduledAt ? values.scheduledAt : null,
      video,
    };

    const validated = validate(payload, item);
    const nextErrors = "errors" in validated ? validated.errors : {};
    if (videoError) nextErrors.video = videoError;
    if (Object.keys(nextErrors).length > 0 || !("save" in validated)) {
      setErrors(nextErrors);
      setFocusRequest((n) => n + 1);
      return;
    }

    mutation.mutate(validated.save, {
      onSuccess: (saved) => {
        setBlockedMessage(null);
        toast.success(SUCCESS_MESSAGES[saved.status](saved));
        router.push(redirectTo ?? `/content/${saved.id}`);
      },
      onError: (error) => {
        if (isApiError(error) && error.code === "NOT_VERIFIED") return setBlockedMessage(error.message);
        if (isApiError(error) && error.code === "VALIDATION_FAILED") {
          setErrors(toFormErrors(error.fieldErrors));
          setFocusRequest((n) => n + 1);
          return;
        }
        setServerError(error.message);
      },
    });
  }

  return {
    formRef,
    values,
    errors,
    setField,
    setFieldError,
    upload,
    selectVideo,
    submit,
    submitting: mutation.isPending || mutation.isSuccess,
    serverError,
    blockedMessage,
    dismissBlocked: () => setBlockedMessage(null),
  };
}
