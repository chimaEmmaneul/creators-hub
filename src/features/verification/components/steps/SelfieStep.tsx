"use client";

import { useState } from "react";
import { PhotoCapture, type AcceptedPhoto } from "../capture/PhotoCapture";
import { StepFrame } from "../StepFrame";
import type { StepProps } from "./types";

const SELFIE_TIPS = ["Face a window or light, not with it behind you", "Remove sunglasses, hats and masks", "Keep a neutral expression"];

export function SelfieStep({ frame, state, submit }: StepProps) {
  const [selfie, setSelfie] = useState<AcceptedPhoto | null>(null);
  const [error, setError] = useState<string>();

  function handleSubmit() {
    if (!selfie && !state.selfieCaptured) {
      setError("Take a selfie to continue");
      return false;
    }
    submit({ step: 3, data: { selfieCaptured: true } });
    return true;
  }

  return (
    <StepFrame
      {...frame}
      title="Selfie check"
      description="We compare a quick selfie with the photo on your ID to confirm it's really you. It takes a few seconds."
      submitLabel="Continue"
      onSubmit={handleSubmit}
    >
      <PhotoCapture
        kind="selfie"
        title="Your selfie"
        tips={SELFIE_TIPS}
        value={selfie}
        savedFileName={state.selfieCaptured ? "selfie" : null}
        onChange={(photo) => {
          setSelfie(photo);
          setError(undefined);
        }}
        error={error}
      />
    </StepFrame>
  );
}
