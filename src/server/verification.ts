import type { Creator } from "@prisma/client";
import type { VerificationStepInput } from "@/lib/schemas";
import type { VerificationState } from "@/types";
import { db } from "./db";
import { invalidState } from "./errors";
import { toVerificationState } from "./mappers";

export const SIMULATED_REVIEW_MS = 6_000;

const FINAL_STEP = 4;

export async function getVerificationState(creatorId: string): Promise<VerificationState> {
  const creator = await db.creator.findUniqueOrThrow({
    where: { id: creatorId },
    include: { verification: true },
  });
  return toVerificationState(creator, creator.verification);
}

function fieldsFor(input: VerificationStepInput) {
  return input.step === FINAL_STEP ? { submittedAt: new Date(), reviewedAt: null, rejectionReason: null } : input.data;
}

export async function submitVerificationStep(
  creator: Pick<Creator, "id" | "verificationStatus">,
  input: VerificationStepInput,
): Promise<VerificationState> {
  if (creator.verificationStatus === "VERIFIED" || creator.verificationStatus === "PENDING") {
    throw invalidState("Your verification has already been submitted.");
  }

  const existing = await db.verification.findUnique({ where: { creatorId: creator.id } });
  const completedStep = existing?.completedStep ?? 0;

  if (input.step > completedStep + 1) {
    throw invalidState(`Complete step ${completedStep + 1} first.`);
  }

  const data = { ...fieldsFor(input), completedStep: Math.max(completedStep, input.step) };

  const [updatedCreator, verification] = await db.$transaction([
    db.creator.update({
      where: { id: creator.id },
      data: input.step === FINAL_STEP ? { verificationStatus: "PENDING" } : {},
    }),
    db.verification.upsert({
      where: { creatorId: creator.id },
      create: { creatorId: creator.id, ...data },
      update: data,
    }),
  ]);

  return toVerificationState(updatedCreator, verification);
}

export async function settleSimulatedReview(creator: Creator): Promise<Creator> {
  if (creator.verificationStatus !== "PENDING") return creator;

  const verification = await db.verification.findUnique({ where: { creatorId: creator.id } });
  const submittedAt = verification?.submittedAt?.getTime();
  if (!verification || !submittedAt || Date.now() - submittedAt < SIMULATED_REVIEW_MS) return creator;

  const approved = !verification.idQualityWarning;
  const [decided] = await db.$transaction([
    db.creator.update({
      where: { id: creator.id },
      data: { verificationStatus: approved ? "VERIFIED" : "REJECTED" },
    }),
    db.verification.update({
      where: { creatorId: creator.id },
      data: { reviewedAt: new Date(), rejectionReason: approved ? null : "DOCUMENT_UNREADABLE" },
    }),
  ]);
  return decided;
}
