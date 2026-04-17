import path from "node:path";
import { pathToFileURL } from "node:url";
import { rmSync } from "node:fs";

export function cleanPaths(cwd: string, targets: readonly string[]): void {
  if (targets.length === 0) {
    throw new Error("Usage: pnpm exec tsx ./scripts/clean-paths.ts <path> [<path> ...]");
  }

  for (const target of targets) {
    rmSync(path.join(cwd, target), {
      force: true,
      recursive: true,
      maxRetries: 5,
      retryDelay: 200
    });
  }
}

function main(): void {
  cleanPaths(process.cwd(), process.argv.slice(2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
