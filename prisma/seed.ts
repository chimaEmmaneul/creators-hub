import { PrismaClient } from "@prisma/client";
import { seedDatabase } from "./seed-data";

const db = new PrismaClient();

seedDatabase(db)
  .then(({ contents, purchases }) => {
    console.log(`Seeded 2 creators, ${contents} content items and ${purchases} purchases.`);
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
