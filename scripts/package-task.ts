import path from "node:path";

import { buildTargets, lintTargets, typecheckTargets, unittestPackage } from "./workflow-lib.js";
import { packageNameFromDir } from "./shared.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  if (!command) {
    throw new Error(
      "Usage: pnpm exec tsx ./scripts/package-task.ts <build|typecheck|lint|lint-fix|unittest|unittest-coverage> [--ignore-build]"
    );
  }
  const ignoreBuild = args.includes("--ignore-build");

  const cwd = process.cwd();
  const packageName = packageNameFromDir(cwd);

  if (command === "build") {
    await buildTargets([packageName]);
    return;
  }
  if (command === "typecheck") {
    typecheckTargets([packageName]);
    return;
  }
  if (command === "lint") {
    lintTargets([packageName], false);
    return;
  }
  if (command === "lint-fix") {
    lintTargets([packageName], true);
    return;
  }
  if (command === "unittest") {
    await unittestPackage(cwd, false, ignoreBuild);
    return;
  }
  if (command === "unittest-coverage") {
    await unittestPackage(cwd, true, ignoreBuild);
    return;
  }

  throw new Error(`Unknown package task: ${command}`);
}

await main();
