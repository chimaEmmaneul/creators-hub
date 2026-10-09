import type { PrismaClient } from "@prisma/client";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "../src/lib/demo-accounts";
import { hashPassword } from "../src/server/auth/password";

export const DEMO_CREATOR_IDS = {
  verified: "creator_amara",
  unverified: "creator_jordan",
} as const;

function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY_MS = 86_400_000;
const daysFromNow = (days: number) => new Date(Date.now() + days * DAY_MS);

interface ContentSeed {
  title: string;
  priceCents: number;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED";
  ageDays: number;
  views?: number;
  scheduledInDays?: number;
}

const AMARA_CONTENT: ContentSeed[] = [
  { title: "Intro to Color Grading", priceCents: 1499, status: "PUBLISHED", ageDays: 88, views: 24_310 },
  { title: "Building a Home Studio on a Budget", priceCents: 2499, status: "PUBLISHED", ageDays: 75, views: 18_902 },
  { title: "5 Shot Composition Tricks", priceCents: 999, status: "PUBLISHED", ageDays: 64, views: 9_874 },
  { title: "Editing Rhythm: Cutting to Music", priceCents: 1999, status: "PUBLISHED", ageDays: 52, views: 6_120 },
  { title: "Lighting for Talking-Head Videos", priceCents: 1299, status: "PUBLISHED", ageDays: 41, views: 4_388 },
  { title: "Sound Design Basics for Creators", priceCents: 1799, status: "PUBLISHED", ageDays: 30, views: 2_975 },
  { title: "How I Plan a Month of Content", priceCents: 799, status: "PUBLISHED", ageDays: 18, views: 1_402 },
  { title: "Camera Settings Cheat Sheet", priceCents: 499, status: "PUBLISHED", ageDays: 9, views: 5 },
  { title: "Storytelling for Short-Form Video", priceCents: 2999, status: "SCHEDULED", ageDays: 4, scheduledInDays: 3 },
  { title: "Behind the Scenes: My Last Shoot", priceCents: 1499, status: "SCHEDULED", ageDays: 2, scheduledInDays: 10 },
  { title: "Thumbnail Design That Converts", priceCents: 1199, status: "DRAFT", ageDays: 1 },
  { title: "Workflow: From Footage to Finished Cut", priceCents: 3499, status: "DRAFT", ageDays: 0 },
];

const JORDAN_CONTENT: ContentSeed[] = [
  { title: "Microphone Shootout: Budget vs Pro", priceCents: 999, status: "DRAFT", ageDays: 3 },
  { title: "Creating a Consistent Visual Style", priceCents: 1499, status: "DRAFT", ageDays: 1 },
];

const COUNTRIES = ["US", "NG", "GB", "CA", "DE", "IN", "BR", "AU", "FR", "ZA", "KE", "JP"];
const PURCHASE_STATUS_WEIGHTS = [
  ...Array<"COMPLETED">(14).fill("COMPLETED"),
  "PENDING",
  "PENDING",
  "REFUNDED",
  "FAILED",
] as const;

const PURCHASE_COUNT = 40;

function toContentRow(creatorId: string, seed: ContentSeed, index: number, random: () => number) {
  const createdAt = daysFromNow(-seed.ageDays);
  return {
    creatorId,
    title: seed.title,
    description: `A practical guide to ${seed.title.toLowerCase()}, with examples you can apply to your next video.`,
    priceCents: seed.priceCents,
    thumbnailUrl: `https://picsum.photos/seed/creatorhub-${index}/640/360`,
    videoFileName: `${seed.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.mp4`,
    videoSizeBytes: BigInt(Math.round((0.2 + random() * 3) * 1024 ** 3)),
    status: seed.status,
    views: seed.views ?? 0,
    scheduledAt: seed.scheduledInDays === undefined ? null : daysFromNow(seed.scheduledInDays),
    publishedAt: seed.status === "PUBLISHED" ? createdAt : null,
    createdAt,
  };
}

export async function seedDatabase(db: PrismaClient) {
  const random = createRandom(20261010);
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const pick = <T>(items: readonly T[]) => items[Math.floor(random() * items.length)];

  await db.$transaction(async (tx) => {
    await tx.purchase.deleteMany();
    await tx.content.deleteMany();
    await tx.verification.deleteMany();
    await tx.creator.deleteMany();

    await tx.creator.create({
      data: {
        id: DEMO_CREATOR_IDS.verified,
        name: DEMO_ACCOUNTS[0].name,
        email: DEMO_ACCOUNTS[0].email,
        passwordHash,
        verificationStatus: "VERIFIED",
        verification: {
          create: {
            completedStep: 4,
            legalName: "Amara Chukwu",
            dateOfBirth: "1994-03-12",
            country: "NG",
            idType: "PASSPORT",
            idFileName: "passport.jpg",
            selfieCaptured: true,
            submittedAt: daysFromNow(-120),
            reviewedAt: daysFromNow(-120),
          },
        },
      },
    });

    await tx.creator.create({
      data: {
        id: DEMO_CREATOR_IDS.unverified,
        name: DEMO_ACCOUNTS[1].name,
        email: DEMO_ACCOUNTS[1].email,
        passwordHash,
        verificationStatus: "UNVERIFIED",
      },
    });

    await tx.content.createMany({
      data: [
        ...AMARA_CONTENT.map((seed, i) => toContentRow(DEMO_CREATOR_IDS.verified, seed, i, random)),
        ...JORDAN_CONTENT.map((seed, i) =>
          toContentRow(DEMO_CREATOR_IDS.unverified, seed, AMARA_CONTENT.length + i, random),
        ),
      ],
    });

    const published = await tx.content.findMany({
      where: { creatorId: DEMO_CREATOR_IDS.verified, status: "PUBLISHED" },
      orderBy: { createdAt: "asc" },
    });

    await tx.purchase.createMany({
      data: Array.from({ length: PURCHASE_COUNT }, () => {
        const content = pick(published);
        const contentAgeDays = Math.floor((Date.now() - content.createdAt.getTime()) / DAY_MS);
        const ageDays = Math.floor(random() * Math.min(contentAgeDays, 60));
        return {
          contentId: content.id,
          buyerCountry: pick(COUNTRIES),
          amountCents: content.priceCents,
          status: pick(PURCHASE_STATUS_WEIGHTS),
          createdAt: new Date(Date.now() - ageDays * DAY_MS - Math.floor(random() * DAY_MS)),
        };
      }),
    });
  });

  return { contents: AMARA_CONTENT.length + JORDAN_CONTENT.length, purchases: PURCHASE_COUNT };
}
