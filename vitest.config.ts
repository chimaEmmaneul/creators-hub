import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: { DATABASE_URL: "file:./test.db" },
    globalSetup: ["tests/global-setup.ts"],
    fileParallelism: false,
  },
});
