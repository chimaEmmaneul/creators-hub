import type { ContentStatus, PurchaseStatus, VerificationStatus } from "@/types";

export type Tone = "neutral" | "success" | "warning" | "danger" | "info";

interface StatusMeta {
  label: string;
  tone: Tone;
}

export const CONTENT_STATUS_META: Record<ContentStatus, StatusMeta> = {
  PUBLISHED: { label: "Published", tone: "success" },
  SCHEDULED: { label: "Scheduled", tone: "info" },
  DRAFT: { label: "Draft", tone: "neutral" },
};

export const PURCHASE_STATUS_META: Record<PurchaseStatus, StatusMeta> = {
  COMPLETED: { label: "Completed", tone: "success" },
  PENDING: { label: "Pending", tone: "warning" },
  REFUNDED: { label: "Refunded", tone: "neutral" },
  FAILED: { label: "Failed", tone: "danger" },
};

export const VERIFICATION_STATUS_META: Record<VerificationStatus, StatusMeta> = {
  VERIFIED: { label: "Verified", tone: "success" },
  PENDING: { label: "In review", tone: "warning" },
  UNVERIFIED: { label: "Not verified", tone: "neutral" },
  REJECTED: { label: "Rejected", tone: "danger" },
};
