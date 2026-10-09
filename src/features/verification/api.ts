import { apiRequest } from "@/lib/api-client";
import type { VerificationStepInput } from "@/lib/schemas";
import type { VerificationState } from "@/types";

export const verificationApi = {
  get: (signal?: AbortSignal) => apiRequest<VerificationState>("/api/verification", { signal }),
  submitStep: (input: VerificationStepInput) => apiRequest<VerificationState>("/api/verification", { method: "POST", body: input }),
};
