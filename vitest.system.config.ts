import path from "node:path";

import { defineConfig } from "vitest/config";

const root = path.resolve(import.meta.dirname);

export default defineConfig({
  resolve: {
    alias: {
      "@clover.js/protocol": path.join(root, "packages", "protocol", "dist", "index.js"),
      "@clover.js/std": path.join(root, "packages", "std", "dist", "index.js"),
      "@clover.js/zod": path.join(root, "packages", "zod", "dist", "index.js"),
      "@clover.js/cli": path.join(root, "packages", "cli", "dist", "index.js"),
      "@clover.js/http": path.join(root, "packages", "http", "dist", "index.js"),
      "@clover.js/eslint-plugin": path.join(root, "packages", "eslint-plugin", "dist", "index.js"),
      "@clover.js/eslint-config": path.join(root, "packages", "eslint-config", "dist", "index.js"),
      "@clover.js/tsconfig/base.json": path.join(root, "packages", "tsconfig", "base.json")
    }
  },
  test: {
    include: ["tests/system/system.test.ts"],
    environment: "node",
    pool: "threads"
  }
});
