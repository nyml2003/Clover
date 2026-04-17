import path from "node:path";

import { defineConfig } from "vitest/config";

const root = path.resolve(import.meta.dirname);

export default defineConfig({
  resolve: {
    alias: {
      "@clover.js/protocol": path.join(root, "packages", "protocol", "src", "index.ts"),
      "@clover.js/std": path.join(root, "packages", "std", "src", "index.ts"),
      "@clover.js/zod": path.join(root, "packages", "zod", "src", "index.ts"),
      "@clover.js/cli": path.join(root, "packages", "cli", "src", "index.ts"),
      "@clover.js/http": path.join(root, "packages", "http", "src", "index.ts"),
      "@clover.js/automation": path.join(root, "packages", "automation", "src", "index.ts"),
      "@clover.js/repo-command": path.join(root, "packages", "repo-command", "src", "index.ts"),
      "@clover.js/eslint-plugin": path.join(root, "packages", "eslint-plugin", "src", "index.ts"),
      "@clover.js/eslint-config": path.join(root, "packages", "eslint-config", "index.ts"),
      "@clover.js/tsconfig/base.json": path.join(root, "packages", "tsconfig", "base.json"),
      "@clover.js/tsconfig/library.json": path.join(root, "packages", "tsconfig", "library.json"),
      "@clover.js/tsconfig/node-cli.json": path.join(root, "packages", "tsconfig", "node-cli.json"),
      "@clover.js/tsconfig/workspace.json": path.join(root, "packages", "tsconfig", "workspace.json")
    }
  },
  test: {
    include: ["packages/*/test/**/*.test.ts"],
    environment: "node",
    pool: "threads"
  }
});
