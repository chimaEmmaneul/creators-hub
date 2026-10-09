import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEMO_CREATOR_IDS, seedDatabase } from "../prisma/seed-data";
import { db } from "@/server/db";
import { SIMULATED_REVIEW_MS, settleSimulatedReview, submitVerificationStep } from "@/server/verification";

const jordan = { id: DEMO_CREATOR_IDS.unverified, verificationStatus: "UNVERIFIED" as const };

async function completeAllSteps({ idQualityWarning = false } = {}) {
  await submitVerificationStep(jordan, { step: 1, data: { legalName: "Jordan Lee", dateOfBirth: "1990-05-01", country: "US" } });
  await submitVerificationStep(jordan, { step: 2, data: { idType: "PASSPORT", idFileName: "passport.jpg", idBackFileName: null, idQualityWarning } });
  await submitVerificationStep(jordan, { step: 3, data: { selfieCaptured: true } });
  return submitVerificationStep(jordan, { step: 4 });
}

beforeEach(async () => {
  await seedDatabase(db);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("verification flow", () => {
  it("moves to PENDING when all four steps are submitted", async () => {
    const state = await completeAllSteps();
    expect(state.status).toBe("PENDING");
    expect(state.completedStep).toBe(4);
  });

  it("approves the simulated review only after the review period", async () => {
    await completeAllSteps();
    const pending = await db.creator.findUniqueOrThrow({ where: { id: jordan.id } });

    expect((await settleSimulatedReview(pending)).verificationStatus).toBe("PENDING");

    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + SIMULATED_REVIEW_MS + 1_000);
    expect((await settleSimulatedReview(pending)).verificationStatus).toBe("VERIFIED");
  });

  it("rejects a kept low-quality ID photo with a specific reason, and accepts a fixed resubmission", async () => {
    await completeAllSteps({ idQualityWarning: true });
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + SIMULATED_REVIEW_MS + 1_000);

    const pending = await db.creator.findUniqueOrThrow({ where: { id: jordan.id } });
    const rejected = await settleSimulatedReview(pending);
    expect(rejected.verificationStatus).toBe("REJECTED");
    expect((await db.verification.findUniqueOrThrow({ where: { creatorId: jordan.id } })).rejectionReason).toBe("DOCUMENT_UNREADABLE");

    const actor = { id: jordan.id, verificationStatus: "REJECTED" as const };
    await submitVerificationStep(actor, { step: 2, data: { idType: "PASSPORT", idFileName: "passport-retake.jpg", idBackFileName: null, idQualityWarning: false } });
    const resubmitted = await submitVerificationStep(actor, { step: 4 });
    expect(resubmitted.status).toBe("PENDING");
    expect(resubmitted.rejectionReason).toBeNull();
  });

  it.todo("rejects a step submitted out of order");
});
