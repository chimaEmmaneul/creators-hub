export const CONTENT_STATUSES = ["DRAFT", "SCHEDULED", "PUBLISHED"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const PURCHASE_STATUSES = ["COMPLETED", "PENDING", "REFUNDED", "FAILED"] as const;
export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number];

export const VERIFICATION_STATUSES = ["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const ID_TYPES = ["PASSPORT", "DRIVERS_LICENSE", "NATIONAL_ID"] as const;
export type IdType = (typeof ID_TYPES)[number];

export type RejectionReason = "DOCUMENT_UNREADABLE";

export interface CreatorSummary {
  id: string;
  name: string;
  email: string;
  verificationStatus: VerificationStatus;
}

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  thumbnailUrl: string | null;
  videoFileName: string;
  videoSizeBytes: number;
  /** Playable source; null for uploads, which are simulated in this demo. */
  videoUrl: string | null;
  videoCredit: string | null;
  videoCreditUrl: string | null;
  status: ContentStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  views: number;
  purchaseCount: number;
  revenueCents: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseItem {
  id: string;
  contentId: string;
  contentTitle: string;
  buyerCountry: string;
  amountCents: number;
  status: PurchaseStatus;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface DashboardOverview {
  totalRevenueCents: number;
  revenueThisMonthCents: number;
  revenueLastMonthCents: number;
  contentCount: number;
  publishedCount: number;
  purchaseCount: number;
}

export interface DailyMetric {
  date: string;
  revenueCents: number;
  purchases: number;
}

export interface VerificationState {
  status: VerificationStatus;
  completedStep: number;
  legalName: string | null;
  dateOfBirth: string | null;
  country: string | null;
  idType: IdType | null;
  idFileName: string | null;
  idBackFileName: string | null;
  idQualityWarning: boolean;
  selfieCaptured: boolean;
  rejectionReason: RejectionReason | null;
  submittedAt: string | null;
}
