import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

const TEST_DB_PATH = "prisma/test.db";

export default function setup() {
  rmSync(TEST_DB_PATH, { force: true });
  rmSync(`${TEST_DB_PATH}-journal`, { force: true });
  execSync("npx prisma db push --skip-generate", {
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
    stdio: "ignore",
  });
}
