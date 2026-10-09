import { beforeEach, describe, expect, it } from "vitest";
import { DEMO_CREATOR_IDS, seedDatabase } from "../prisma/seed-data";
import { createContent, deleteContent, listContent, publishContent, updateContent } from "@/server/content";
import { db } from "@/server/db";
import { DomainError } from "@/server/errors";
import type { CreateContentInput } from "@/lib/schemas";

const verified = { id: DEMO_CREATOR_IDS.verified, verificationStatus: "VERIFIED" as const };
const unverified = { id: DEMO_CREATOR_IDS.unverified, verificationStatus: "UNVERIFIED" as const };

const draftInput: CreateContentInput = {
  title: "Test video",
  description: "A description that is long enough.",
  priceCents: 999,
  thumbnailUrl: null,
  status: "DRAFT",
  scheduledAt: null,
  video: { fileName: "test.mp4", sizeBytes: 1024 },
};

async function firstDraftOf(creatorId: string) {
  return db.content.findFirstOrThrow({ where: { creatorId, status: "DRAFT" } });
}

async function expectDomainError(promise: Promise<unknown>, code: DomainError["code"]) {
  await expect(promise).rejects.toBeInstanceOf(DomainError);
  await expect(promise).rejects.toMatchObject({ code });
}

beforeEach(async () => {
  await seedDatabase(db);
});

describe("publishing gate", () => {
  it("blocks an unverified creator from publishing a draft", async () => {
    const draft = await firstDraftOf(unverified.id);
    await expectDomainError(publishContent(unverified, draft.id), "NOT_VERIFIED");
    expect((await db.content.findUniqueOrThrow({ where: { id: draft.id } })).status).toBe("DRAFT");
  });

  it("blocks an unverified creator from creating published or scheduled content", async () => {
    await expectDomainError(createContent(unverified, { ...draftInput, status: "PUBLISHED" }), "NOT_VERIFIED");
    const inOneDay = new Date(Date.now() + 86_400_000).toISOString();
    await expectDomainError(createContent(unverified, { ...draftInput, status: "SCHEDULED", scheduledAt: inOneDay }), "NOT_VERIFIED");
  });

  it("blocks an unverified creator from publishing through an edit", async () => {
    const draft = await firstDraftOf(unverified.id);
    await expectDomainError(updateContent(unverified, draft.id, { ...draftInput, status: "PUBLISHED", video: null }), "NOT_VERIFIED");
  });

  it("still lets an unverified creator save drafts", async () => {
    const created = await createContent(unverified, draftInput);
    expect(created.status).toBe("DRAFT");
  });

  it("lets a verified creator publish their own draft", async () => {
    const draft = await firstDraftOf(verified.id);
    const published = await publishContent(verified, draft.id);
    expect(published.status).toBe("PUBLISHED");
    expect(published.publishedAt).not.toBeNull();
  });

  it("treats another creator's content as not found", async () => {
    const othersDraft = await firstDraftOf(unverified.id);
    await expectDomainError(publishContent(verified, othersDraft.id), "NOT_FOUND");
    await expectDomainError(deleteContent(verified, othersDraft.id), "NOT_FOUND");
  });
});

describe("content lifecycle", () => {
  it("soft-deletes content and keeps its purchase history", async () => {
    const sold = await db.content.findFirstOrThrow({ where: { creatorId: verified.id, purchases: { some: {} } } });
    const purchasesBefore = await db.purchase.count({ where: { contentId: sold.id } });

    await deleteContent(verified, sold.id);

    expect((await listContent(verified)).some((item) => item.id === sold.id)).toBe(false);
    expect(await db.purchase.count({ where: { contentId: sold.id } })).toBe(purchasesBefore);
  });

  it("releases scheduled content once its time has passed", async () => {
    const scheduled = await db.content.findFirstOrThrow({ where: { creatorId: verified.id, status: "SCHEDULED" } });
    await db.content.update({ where: { id: scheduled.id }, data: { scheduledAt: new Date(Date.now() - 60_000) } });

    const items = await listContent(verified);
    expect(items.find((item) => item.id === scheduled.id)?.status).toBe("PUBLISHED");
  });
});
