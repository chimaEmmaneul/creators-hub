import type { VerificationStepInput } from "@/lib/schemas";
import type { VerificationState } from "@/types";

export interface StepFrameBindings {
  step: number;
  totalSteps: number;
  pending: boolean;
  error: string | null;
  focusOnMount: boolean;
  onBack?: () => void;
}

export interface StepProps {
  frame: StepFrameBindings;
  state: VerificationState;
  submit: (input: VerificationStepInput) => void;
}
