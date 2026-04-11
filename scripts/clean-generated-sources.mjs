import { readdirSync, rmSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const packageRoots = [
  "packages/protocol/src",
  "packages/std/src",
  "packages/zod/src",
  "packages/cli/src",
  "packages/eslint-plugin/src"
];

const generatedSuffixes = [".js", ".d.ts"];

function removeGeneratedFiles(directory) {
  for (const entry of readdirSync(directory)) {
    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      removeGeneratedFiles(fullPath);
      continue;
    }

    if (generatedSuffixes.some((suffix) => fullPath.endsWith(suffix))) {
      rmSync(fullPath, {
        force: true
      });
    }
  }
}

for (const packageRoot of packageRoots) {
  removeGeneratedFiles(resolve(process.cwd(), packageRoot));
}
