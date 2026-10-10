import type { Content, Creator, Purchase, Verification } from "@prisma/client";
import type { ContentItem, CreatorSummary, PurchaseItem, VerificationState } from "@/types";

const iso = (date: Date | null) => date?.toISOString() ?? null;

export function toCreatorSummary(creator: Creator): CreatorSummary {
  return {
    id: creator.id,
    name: creator.name,
    email: creator.email,
    verificationStatus: creator.verificationStatus,
  };
}

export function toContentItem(
  content: Content,
  sales: { purchaseCount: number; revenueCents: number },
): ContentItem {
  return {
    id: content.id,
    title: content.title,
    description: content.description,
    priceCents: content.priceCents,
    thumbnailUrl: content.thumbnailUrl,
    videoFileName: content.videoFileName,
    videoSizeBytes: Number(content.videoSizeBytes),
    videoUrl: content.videoUrl,
    videoCredit: content.videoCredit,
    videoCreditUrl: content.videoCreditUrl,
    status: content.status,
    scheduledAt: iso(content.scheduledAt),
    publishedAt: iso(content.publishedAt),
    views: content.views,
    purchaseCount: sales.purchaseCount,
    revenueCents: sales.revenueCents,
    createdAt: content.createdAt.toISOString(),
    updatedAt: content.updatedAt.toISOString(),
  };
}

export function toPurchaseItem(purchase: Purchase & { content: { title: string } }): PurchaseItem {
  return {
    id: purchase.id,
    contentId: purchase.contentId,
    contentTitle: purchase.content.title,
    buyerCountry: purchase.buyerCountry,
    amountCents: purchase.amountCents,
    status: purchase.status,
    createdAt: purchase.createdAt.toISOString(),
  };
}

export function toVerificationState(
  creator: Pick<Creator, "verificationStatus">,
  verification: Verification | null,
): VerificationState {
  return {
    status: creator.verificationStatus,
    completedStep: verification?.completedStep ?? 0,
    legalName: verification?.legalName ?? null,
    dateOfBirth: verification?.dateOfBirth ?? null,
    country: verification?.country ?? null,
    idType: verification?.idType ?? null,
    idFileName: verification?.idFileName ?? null,
    idBackFileName: verification?.idBackFileName ?? null,
    idQualityWarning: verification?.idQualityWarning ?? false,
    selfieCaptured: verification?.selfieCaptured ?? false,
    rejectionReason: verification?.rejectionReason ?? null,
    submittedAt: iso(verification?.submittedAt ?? null),
  };
}
