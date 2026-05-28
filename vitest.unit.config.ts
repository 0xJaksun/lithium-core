import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.unit.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text"],
    },
  },
});
