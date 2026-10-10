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

/**
 * Real, playable videos for the seeded library: Blender open movies hosted on
 * Wikimedia Commons under Creative Commons licences (credited on each video's
 * page). One per seeded item, in seed order.
 */
const DEMO_VIDEOS = [
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/1/10/Tears_of_Steel_in_4k_-_Official_Blender_Foundation_release.webm/Tears_of_Steel_in_4k_-_Official_Blender_Foundation_release.webm.720p.vp9.webm",
    poster: "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/Tears_of_Steel_in_4k_-_Official_Blender_Foundation_release.webm/960px--Tears_of_Steel_in_4k_-_Official_Blender_Foundation_release.webm.jpg",
    credit: "“Tears of Steel” by Blender Foundation, CC BY 3.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Tears_of_Steel_in_4k_-_Official_Blender_Foundation_release.webm",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/Big_Buck_Bunny_4K.webm/Big_Buck_Bunny_4K.webm.720p.vp9.webm",
    poster: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c0/Big_Buck_Bunny_4K.webm/960px--Big_Buck_Bunny_4K.webm.jpg",
    credit: "“Big Buck Bunny” by Blender Foundation, CC BY 3.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Big_Buck_Bunny_4K.webm",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/f/f1/Sintel_movie_4K.webm/Sintel_movie_4K.webm.720p.vp9.webm",
    poster: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f1/Sintel_movie_4K.webm/960px--Sintel_movie_4K.webm.jpg",
    credit: "“Sintel” by Blender Foundation, CC BY 3.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Sintel_movie_4K.webm",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/a/a5/Spring_-_Blender_Open_Movie.webm/Spring_-_Blender_Open_Movie.webm.720p.vp9.webm",
    poster: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a5/Spring_-_Blender_Open_Movie.webm/960px--Spring_-_Blender_Open_Movie.webm.jpg",
    credit: "“Spring” by Blender Studio, CC BY 4.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Spring_-_Blender_Open_Movie.webm",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/a/a2/Elephants_Dream_%282006%29.webm/Elephants_Dream_%282006%29.webm.720p.vp9.webm",
    poster: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a2/Elephants_Dream_%282006%29.webm/960px--Elephants_Dream_%282006%29.webm.jpg",
    credit: "“Elephants Dream” by Blender Foundation, CC BY 2.5",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Elephants_Dream_(2006).webm",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/7/76/Sprite_Fright_-_Blender_Open_Movie-full_movie.webm/Sprite_Fright_-_Blender_Open_Movie-full_movie.webm.720p.vp9.webm",
    poster: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/76/Sprite_Fright_-_Blender_Open_Movie-full_movie.webm/960px--Sprite_Fright_-_Blender_Open_Movie-full_movie.webm.jpg",
    credit: "“Sprite Fright” by Blender Studio, CC BY 4.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Sprite_Fright_-_Blender_Open_Movie-full_movie.webm",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/3/3f/Coffee_Run_-_Blender_Open_Movie-full_movie.webm/Coffee_Run_-_Blender_Open_Movie-full_movie.webm.720p.vp9.webm",
    poster: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3f/Coffee_Run_-_Blender_Open_Movie-full_movie.webm/960px--Coffee_Run_-_Blender_Open_Movie-full_movie.webm.jpg",
    credit: "“Coffee Run” by Blender Studio, CC BY 4.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Coffee_Run_-_Blender_Open_Movie-full_movie.webm",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/7/7c/Caminandes_-_Gran_Dillama_-_Blender_Foundation%27s_new_Open_Movie.webm/Caminandes_-_Gran_Dillama_-_Blender_Foundation%27s_new_Open_Movie.webm.720p.vp9.webm",
    poster: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7c/Caminandes_-_Gran_Dillama_-_Blender_Foundation%27s_new_Open_Movie.webm/960px--Caminandes_-_Gran_Dillama_-_Blender_Foundation%27s_new_Open_Movie.webm.jpg",
    credit: "“Caminandes: Gran Dillama” by Blender Foundation, CC BY-SA 3.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Caminandes_-_Gran_Dillama_-_Blender_Foundation%27s_new_Open_Movie.webm",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/7/7a/Charge_-_Blender_Open_Movie-full_movie.webm/Charge_-_Blender_Open_Movie-full_movie.webm.720p.vp9.webm",
    poster: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7a/Charge_-_Blender_Open_Movie-full_movie.webm/960px--Charge_-_Blender_Open_Movie-full_movie.webm.jpg",
    credit: "“Charge” by Blender Studio, CC BY 4.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Charge_-_Blender_Open_Movie-full_movie.webm",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/3/38/WING_IT%21_-_Blender_Open_Movie-full_movie.webm/WING_IT%21_-_Blender_Open_Movie-full_movie.webm.720p.vp9.webm",
    poster: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/38/WING_IT%21_-_Blender_Open_Movie-full_movie.webm/960px--WING_IT%21_-_Blender_Open_Movie-full_movie.webm.jpg",
    credit: "“Wing It!” by Blender Studio, CC BY 4.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:WING_IT!_-_Blender_Open_Movie-full_movie.webm",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/a/a9/HERO_-_Blender_Open_Movie-full_movie.webm/HERO_-_Blender_Open_Movie-full_movie.webm.720p.vp9.webm",
    poster: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a9/HERO_-_Blender_Open_Movie-full_movie.webm/960px--HERO_-_Blender_Open_Movie-full_movie.webm.jpg",
    credit: "“Hero” by Blender Studio, CC BY 4.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:HERO_-_Blender_Open_Movie-full_movie.webm",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/0/02/Glass_Half_-_Blender_Open_Movie-full_movie.webm/Glass_Half_-_Blender_Open_Movie-full_movie.webm.720p.vp9.webm",
    poster: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/02/Glass_Half_-_Blender_Open_Movie-full_movie.webm/960px--Glass_Half_-_Blender_Open_Movie-full_movie.webm.jpg",
    credit: "“Glass Half” by Blender Studio, CC BY 4.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Glass_Half_-_Blender_Open_Movie-full_movie.webm",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/b/b2/The_Daily_Dweebs_-_Blender_Open_Movie-full_movie.webm/The_Daily_Dweebs_-_Blender_Open_Movie-full_movie.webm.720p.vp9.webm",
    poster: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b2/The_Daily_Dweebs_-_Blender_Open_Movie-full_movie.webm/960px--The_Daily_Dweebs_-_Blender_Open_Movie-full_movie.webm.jpg",
    credit: "“The Daily Dweebs” by Blender Studio, CC BY 4.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:The_Daily_Dweebs_-_Blender_Open_Movie-full_movie.webm",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/f/f2/SINGULARITY_-_Blender_Open_Movie-full_movie.webm/SINGULARITY_-_Blender_Open_Movie-full_movie.webm.480p.vp9.webm",
    poster: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f2/SINGULARITY_-_Blender_Open_Movie-full_movie.webm/960px--SINGULARITY_-_Blender_Open_Movie-full_movie.webm.jpg",
    credit: "“Singularity” by Blender Studio, CC BY 4.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:SINGULARITY_-_Blender_Open_Movie-full_movie.webm",
  },
] as const;

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
  const video = DEMO_VIDEOS[index % DEMO_VIDEOS.length];
  return {
    creatorId,
    title: seed.title,
    description: `A practical guide to ${seed.title.toLowerCase()}, with examples you can apply to your next video.`,
    priceCents: seed.priceCents,
    thumbnailUrl: video.poster,
    videoFileName: `${seed.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.mp4`,
    videoSizeBytes: BigInt(Math.round((0.2 + random() * 3) * 1024 ** 3)),
    videoUrl: video.url,
    videoCredit: video.credit,
    videoCreditUrl: video.creditUrl,
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
