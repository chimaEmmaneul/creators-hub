"use client";

import { AlertTriangle } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { FormField, Input, Textarea } from "@/components/ui/FormField";
import { Card } from "@/components/ui/Card";
import type { ContentItem, ContentStatus } from "@/types";
import { useCurrentCreator } from "@/features/account/queries";
import { useContentForm } from "../../hooks/use-content-form";
import { validateVideoFile } from "../../lib/media";
import { PublishOptionsField } from "./PublishOptionsField";
import { ThumbnailField } from "./ThumbnailField";
import { VideoUploadField } from "./VideoUploadField";

const DESCRIPTION_MAX = 2000;

const SUBMIT_LABELS: Record<ContentStatus, string> = {
  DRAFT: "Save draft",
  PUBLISHED: "Publish video",
  SCHEDULED: "Schedule video",
};

export function ContentForm({ item }: { item?: ContentItem }) {
  const canPublish = useCurrentCreator().data?.verificationStatus === "VERIFIED";
  const { formRef, values, errors, setField, setFieldError, upload, selectVideo, submit, submitting, serverError, blockedMessage, dismissBlocked } =
    useContentForm(item);
  const uploading = upload.state.status === "uploading";

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start"
    >
      <div className="flex flex-col gap-6">
        <Card className="flex flex-col gap-5 p-4 sm:p-6">
          <h2 className="text-base font-semibold text-fg">Video</h2>
          <VideoUploadField
            state={upload.state}
            error={errors.video}
            onSelect={(file) => selectVideo(file, validateVideoFile)}
            onRetry={upload.retry}
            onCancel={upload.cancel}
          />
          <ThumbnailField
            value={values.thumbnailUrl}
            error={errors.thumbnailUrl}
            onChange={(value) => setField("thumbnailUrl", value)}
            onError={(message) => setFieldError("thumbnailUrl", message)}
          />
        </Card>

        <Card className="flex flex-col gap-5 p-4 sm:p-6">
          <h2 className="text-base font-semibold text-fg">Details</h2>
          <FormField label="Title" required error={errors.title}>
            {(control) => (
              <Input {...control} value={values.title} onChange={(e) => setField("title", e.target.value)} maxLength={120} placeholder="e.g. Intro to Color Grading" />
            )}
          </FormField>
          <FormField
            label="Description"
            required
            error={errors.description}
            hint="Tell viewers what they'll learn or get from this video."
            aside={
              <span className="text-xs text-muted tabular-nums" aria-hidden="true">
                {values.description.length}/{DESCRIPTION_MAX}
              </span>
            }
          >
            {(control) => (
              <Textarea {...control} rows={5} maxLength={DESCRIPTION_MAX} value={values.description} onChange={(e) => setField("description", e.target.value)} />
            )}
          </FormField>
          <FormField label="Price (USD)" required error={errors.price} hint="Between $0.99 and $999.99." className="sm:max-w-56">
            {(control) => (
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted" aria-hidden="true">
                  $
                </span>
                <Input {...control} inputMode="decimal" autoComplete="off" placeholder="9.99" className="pl-7 tabular-nums" value={values.price} onChange={(e) => setField("price", e.target.value)} />
              </div>
            )}
          </FormField>
        </Card>
      </div>

      <Card className="flex flex-col gap-5 p-4 sm:p-6 lg:sticky lg:top-10">
        <h2 className="text-base font-semibold text-fg">Publishing</h2>
        <PublishOptionsField
          status={values.status}
          scheduledAt={values.scheduledAt}
          canPublish={canPublish}
          statusError={errors.status}
          scheduleError={errors.scheduledAt}
          onStatusChange={(status) => setField("status", status)}
          onScheduleChange={(value) => setField("scheduledAt", value)}
        />

        {serverError && (
          <div role="alert" className="flex gap-2 rounded-lg bg-danger-soft p-3 text-sm text-danger">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>
              {serverError} Your changes are still here. <span className="font-medium">Try again.</span>
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-line pt-5">
          <Button type="submit" loading={submitting}>
            {submitting ? "Saving…" : item ? "Save changes" : SUBMIT_LABELS[values.status]}
          </Button>
          <ButtonLink href={item ? `/content/${item.id}` : "/"} variant="ghost">
            Cancel
          </ButtonLink>
          {uploading && <p className="text-center text-xs text-muted">You can submit as soon as your upload finishes.</p>}
        </div>
      </Card>

      <Dialog
        open={blockedMessage !== null}
        onClose={dismissBlocked}
        title="Verify your identity to publish"
        description={`${blockedMessage ?? ""} Save your work as a draft now and it will be waiting for you.`}
        dismissible={!submitting}
        footer={
          <>
            <Button variant="secondary" onClick={() => submit({ status: "DRAFT" })} disabled={submitting} data-autofocus>
              Save as draft
            </Button>
            <Button onClick={() => submit({ status: "DRAFT", redirectTo: "/verify" })} loading={submitting}>
              Save draft & verify
            </Button>
          </>
        }
      />
    </form>
  );
}
