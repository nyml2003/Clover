import { existsSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const PACKAGE_ROOTS = [
  "packages/protocol/src",
  "packages/std/src",
  "packages/zod/src",
  "packages/cli/src",
  "packages/automation/src",
  "packages/http/src",
  "packages/repo-command/src",
  "packages/eslint-plugin/src"
] as const;

const GENERATED_SUFFIXES = [".js", ".d.ts"] as const;

function visit(dir: string): void {
  for (const dirent of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, dirent.name);
    if (dirent.isDirectory()) {
      visit(fullPath);
      continue;
    }
    if (GENERATED_SUFFIXES.some((suffix) => dirent.name.endsWith(suffix))) {
      rmSync(fullPath, { force: true });
    }
  }
}

export function cleanGeneratedSources(cwd: string): void {
  for (const packageRoot of PACKAGE_ROOTS) {
    const absoluteRoot = path.join(cwd, packageRoot);
    if (!existsSync(absoluteRoot)) {
      continue;
    }
    visit(absoluteRoot);
  }
}

function main(): void {
  cleanGeneratedSources(process.cwd());
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
