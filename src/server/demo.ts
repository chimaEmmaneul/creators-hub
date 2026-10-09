import { seedDatabase } from "../../prisma/seed-data";
import { db } from "./db";

export async function resetDemoData() {
  await seedDatabase(db);
}
