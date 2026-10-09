import type { ContentStatus, VerificationStatus } from "@/types";
import { DomainError } from "./errors";

export const canPublish = (status: VerificationStatus) => status === "VERIFIED";

export const isPublicStatus = (status: ContentStatus) => status !== "DRAFT";

export function assertCanPublish(creator: { verificationStatus: VerificationStatus }) {
  if (!canPublish(creator.verificationStatus)) {
    throw new DomainError(
      "NOT_VERIFIED",
      creator.verificationStatus === "PENDING"
        ? "Your verification is still in review. You can publish as soon as it's approved."
        : "Verify your identity before publishing. Your draft has been kept.",
    );
  }
}
