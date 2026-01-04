import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    include: ["test/e2e.test.ts"],
    testTimeout: 120000,
    pool: "forks",
    isolate: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.d.ts", "src/cli.ts"]
    }
  }
})
