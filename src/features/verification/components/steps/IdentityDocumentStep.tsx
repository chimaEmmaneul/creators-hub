"use client";

import { useState } from "react";
import { BookUser, CarFront, IdCard } from "lucide-react";
import { identityDocumentSchema, requiresBackSide, validateFields } from "@/lib/schemas";
import type { IdType } from "@/types";
import { RadioCardGroup, type RadioCardOption } from "@/components/ui/RadioCardGroup";
import { PhotoCapture, type AcceptedPhoto } from "../capture/PhotoCapture";
import { StepFrame } from "../StepFrame";
import type { StepProps } from "./types";

export const ID_TYPE_OPTIONS: RadioCardOption<IdType>[] = [
  { value: "PASSPORT", label: "Passport", description: "Photo page only", icon: BookUser },
  { value: "DRIVERS_LICENSE", label: "Driver's license", description: "Front and back", icon: CarFront },
  { value: "NATIONAL_ID", label: "National ID card", description: "Front and back", icon: IdCard },
];

const DOCUMENT_TIPS = [
  "Place it on a dark, flat surface",
  "Make sure all four corners are visible",
  "Avoid glare from lamps and windows",
];

export function IdentityDocumentStep({ frame, state, submit }: StepProps) {
  const [idType, setIdType] = useState<IdType | null>(state.idType);
  const [front, setFront] = useState<AcceptedPhoto | null>(null);
  const [back, setBack] = useState<AcceptedPhoto | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sameTypeAsSaved = idType === state.idType;
  const savedFront = sameTypeAsSaved ? state.idFileName : null;
  const savedBack = sameTypeAsSaved ? state.idBackFileName : null;
  const needsBack = idType ? requiresBackSide(idType) : false;
  const typeLabel = ID_TYPE_OPTIONS.find((option) => option.value === idType)?.label.toLowerCase() ?? "document";

  function handleSubmit() {
    const usedNewPhoto = Boolean(front || back);
    const result = validateFields(identityDocumentSchema, {
      idType,
      idFileName: front?.image.fileName ?? savedFront ?? "",
      idBackFileName: needsBack ? (back?.image.fileName ?? savedBack ?? null) : null,
      idQualityWarning: usedNewPhoto
        ? Boolean(front?.acceptedDespiteIssues || back?.acceptedDespiteIssues)
        : state.idQualityWarning,
    });
    if (!result.success) {
      setErrors(result.errors);
      return false;
    }
    submit({ step: 2, data: result.data });
    return true;
  }

  return (
    <StepFrame
      {...frame}
      title="Identity document"
      description="Choose a valid, government-issued photo ID. Expired documents can't be accepted."
      submitLabel="Continue"
      onSubmit={handleSubmit}
    >
      <RadioCardGroup
        legend="Document type"
        options={ID_TYPE_OPTIONS}
        value={idType}
        onChange={(value) => {
          setIdType(value);
          setBack(null);
          setErrors({});
        }}
        error={errors.idType}
        className="sm:grid-cols-3"
      />

      {idType && (
        <div className="flex flex-col gap-3">
          <PhotoCapture
            kind="document"
            title={needsBack ? `Front of your ${typeLabel}` : "Passport photo page"}
            tips={DOCUMENT_TIPS}
            value={front}
            savedFileName={savedFront}
            onChange={(photo) => {
              setFront(photo);
              setErrors((current) => ({ ...current, idFileName: "" }));
            }}
            error={errors.idFileName}
          />
          {needsBack && (
            <PhotoCapture
              kind="document"
              title={`Back of your ${typeLabel}`}
              tips={["Turn the card over and capture the back the same way"]}
              value={back}
              savedFileName={savedBack}
              onChange={(photo) => {
                setBack(photo);
                setErrors((current) => ({ ...current, idBackFileName: "" }));
              }}
              error={errors.idBackFileName}
            />
          )}
        </div>
      )}
    </StepFrame>
  );
}
