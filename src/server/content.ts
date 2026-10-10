import type { Content, Creator, Prisma } from "@prisma/client";
import type { CreateContentInput, UpdateContentInput } from "@/lib/schemas";
import type { ContentItem } from "@/types";
import { db } from "./db";
import { invalidState, notFound } from "./errors";
import { toContentItem } from "./mappers";
import { assertCanPublish, canPublish, isPublicStatus } from "./publishing-policy";

type Actor = Pick<Creator, "id" | "verificationStatus">;

const activeContentOf = (creatorId: string): Prisma.ContentWhereInput => ({
  creatorId,
  deletedAt: null,
});

async function salesByContent(contentIds: string[]) {
  const rows = await db.purchase.groupBy({
    by: ["contentId"],
    where: { contentId: { in: contentIds }, status: "COMPLETED" },
    _count: { _all: true },
    _sum: { amountCents: true },
  });
  return new Map(
    rows.map((row) => [
      row.contentId,
      { purchaseCount: row._count._all, revenueCents: row._sum.amountCents ?? 0 },
    ]),
  );
}

async function withSales(rows: Content[]): Promise<ContentItem[]> {
  const sales = await salesByContent(rows.map((row) => row.id));
  return rows.map((row) =>
    toContentItem(row, sales.get(row.id) ?? { purchaseCount: 0, revenueCents: 0 }),
  );
}

async function findOwnedOrThrow(creatorId: string, contentId: string) {
  const content = await db.content.findFirst({
    where: { id: contentId, ...activeContentOf(creatorId) },
  });
  if (!content) throw notFound("Content");
  return content;
}

function publicationFields(input: Pick<CreateContentInput, "status" | "scheduledAt">, current?: Content) {
  return {
    status: input.status,
    scheduledAt: input.status === "SCHEDULED" && input.scheduledAt ? new Date(input.scheduledAt) : null,
    publishedAt: input.status === "PUBLISHED" ? (current?.publishedAt ?? new Date()) : null,
  };
}

export async function releaseDueScheduledContent(actor: Actor) {
  if (!canPublish(actor.verificationStatus)) return;
  await db.content.updateMany({
    where: { ...activeContentOf(actor.id), status: "SCHEDULED", scheduledAt: { lte: new Date() } },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
}

export async function listContent(actor: Actor): Promise<ContentItem[]> {
  await releaseDueScheduledContent(actor);
  const rows = await db.content.findMany({
    where: activeContentOf(actor.id),
    orderBy: { createdAt: "desc" },
  });
  return withSales(rows);
}

export async function getContent(actor: Actor, contentId: string): Promise<ContentItem> {
  await releaseDueScheduledContent(actor);
  const [item] = await withSales([await findOwnedOrThrow(actor.id, contentId)]);
  return item;
}

export async function createContent(actor: Actor, input: CreateContentInput): Promise<ContentItem> {
  if (isPublicStatus(input.status)) assertCanPublish(actor);

  const row = await db.content.create({
    data: {
      creatorId: actor.id,
      title: input.title,
      description: input.description,
      priceCents: input.priceCents,
      thumbnailUrl: input.thumbnailUrl,
      videoFileName: input.video.fileName,
      videoSizeBytes: BigInt(input.video.sizeBytes),
      ...publicationFields(input),
    },
  });
  const [item] = await withSales([row]);
  return item;
}

export async function updateContent(
  actor: Actor,
  contentId: string,
  input: UpdateContentInput,
): Promise<ContentItem> {
  const current = await findOwnedOrThrow(actor.id, contentId);
  if (isPublicStatus(input.status)) assertCanPublish(actor);

  const row = await db.content.update({
    where: { id: current.id },
    data: {
      title: input.title,
      description: input.description,
      priceCents: input.priceCents,
      thumbnailUrl: input.thumbnailUrl,
      ...(input.video && {
        videoFileName: input.video.fileName,
        videoSizeBytes: BigInt(input.video.sizeBytes),
        // A replaced file is a simulated upload, so the old playable source no longer applies.
        videoUrl: null,
        videoCredit: null,
        videoCreditUrl: null,
      }),
      ...publicationFields(input, current),
    },
  });
  const [item] = await withSales([row]);
  return item;
}

export async function publishContent(actor: Actor, contentId: string): Promise<ContentItem> {
  const current = await findOwnedOrThrow(actor.id, contentId);
  if (current.status === "PUBLISHED") throw invalidState("This content is already published.");
  assertCanPublish(actor);

  const row = await db.content.update({
    where: { id: current.id },
    data: publicationFields({ status: "PUBLISHED", scheduledAt: null }),
  });
  const [item] = await withSales([row]);
  return item;
}

export async function deleteContent(actor: Actor, contentId: string): Promise<void> {
  const current = await findOwnedOrThrow(actor.id, contentId);
  await db.content.update({ where: { id: current.id }, data: { deletedAt: new Date() } });
}
