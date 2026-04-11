import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@clover/protocol": fileURLToPath(new URL("./packages/protocol/src/index.ts", import.meta.url)),
      "@clover/std": fileURLToPath(new URL("./packages/std/src/index.ts", import.meta.url)),
      "@clover/zod": fileURLToPath(new URL("./packages/zod/src/index.ts", import.meta.url))
    }
  },
  test: {
    environment: "node",
    include: ["packages/*/test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "packages/protocol/src/**/*.ts",
        "packages/std/src/**/*.ts",
        "packages/zod/src/**/*.ts"
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90
      }
    }
  }
});
