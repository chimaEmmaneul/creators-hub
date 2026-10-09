"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { formatCountry, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FormField";
import { StepFrame } from "../StepFrame";
import { ID_TYPE_OPTIONS } from "./IdentityDocumentStep";
import type { StepProps } from "./types";

interface ReviewStepProps extends StepProps {
  onEditStep: (step: number) => void;
}

export function ReviewStep({ frame, state, submit, onEditStep }: ReviewStepProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string>();

  const sections = [
    {
      step: 1,
      title: "Personal information",
      rows: [
        ["Legal name", state.legalName],
        ["Date of birth", state.dateOfBirth && formatDate(`${state.dateOfBirth}T00:00:00`)],
        ["Country", state.country && formatCountry(state.country)],
      ],
    },
    {
      step: 2,
      title: "Identity document",
      rows: [
        ["Document type", ID_TYPE_OPTIONS.find((option) => option.value === state.idType)?.label],
        ["Front", state.idFileName ? "Photo added" : null],
        ...(state.idBackFileName ? [["Back", "Photo added"]] : []),
      ],
    },
    { step: 3, title: "Selfie", rows: [["Selfie check", state.selfieCaptured ? "Completed" : null]] },
  ];

  function handleSubmit() {
    if (!confirmed) {
      setError("Confirm that your details are accurate");
      return false;
    }
    submit({ step: 4 });
    return true;
  }

  return (
    <StepFrame
      {...frame}
      title="Review and submit"
      description="Check your details. You can't change them while the review is in progress."
      submitLabel="Submit for review"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col divide-y divide-line rounded-xl border border-line">
        {sections.map((section) => (
          <section key={section.step} aria-labelledby={`review-${section.step}`} className="p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 id={`review-${section.step}`} className="text-sm font-semibold text-fg">
                {section.title}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => onEditStep(section.step)} aria-label={`Edit ${section.title.toLowerCase()}`}>
                Edit
              </Button>
            </div>
            <dl className="flex flex-col gap-1.5 text-sm">
              {section.rows.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-muted">{label}</dt>
                  <dd className="min-w-0 truncate text-right text-fg">{value || "—"}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      {state.idQualityWarning && (
        <p className="flex gap-2 rounded-lg bg-warning-soft p-3 text-sm text-fg">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          <span>
            Your ID photo didn&apos;t pass our quality check, so it may be rejected.{" "}
            <button type="button" onClick={() => onEditStep(2)} className="font-medium text-accent underline">
              Retake it now
            </button>{" "}
            to avoid a delay.
          </span>
        </p>
      )}

      <div>
        <label className="flex cursor-pointer items-start gap-3 rounded-lg p-1 text-sm text-fg">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => {
              setConfirmed(event.target.checked);
              setError(undefined);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby="review-confirm-error"
            className="mt-0.5 size-5 shrink-0 cursor-pointer accent-accent"
          />
          I confirm these details are accurate and belong to me.
        </label>
        <FieldError id="review-confirm-error" message={error} />
      </div>
    </StepFrame>
  );
}
