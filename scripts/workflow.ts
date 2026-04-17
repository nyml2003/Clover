import {
  buildAll,
  lintAll,
  releaseCheck,
  runBench,
  testCoverage,
  testSystem,
  testUnit,
  typecheckAll
} from "./workflow-lib.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  if (!command) {
    throw new Error(
      "Usage: pnpm exec tsx ./scripts/workflow.ts <build|typecheck|lint|test|test-system|test-coverage|bench|release-check> [--ignore-build]"
    );
  }
  const ignoreBuild = args.includes("--ignore-build");

  if (command === "build") {
    await buildAll();
    return;
  }
  if (command === "typecheck") {
    typecheckAll();
    return;
  }
  if (command === "lint") {
    lintAll();
    return;
  }
  if (command === "test") {
    if (!ignoreBuild) {
      await buildAll();
    }
    testUnit();
    return;
  }
  if (command === "test-system") {
    if (!ignoreBuild) {
      await buildAll();
    }
    testSystem();
    return;
  }
  if (command === "test-coverage") {
    if (!ignoreBuild) {
      await buildAll();
    }
    testCoverage();
    return;
  }
  if (command === "bench") {
    await runBench(ignoreBuild);
    return;
  }
  if (command === "release-check") {
    await releaseCheck();
    return;
  }

  throw new Error(`Unknown workflow command: ${command}`);
}

await main();
