import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

import {
  ESLINT_BIN,
  ROOT,
  TSC_BIN,
  VITEST_BIN,
  dependencyClosure,
  loadWorkspacePackages,
  packageNameFromDir,
  run
} from "./shared.js";
import { buildPackage } from "./build-package.js";
import { cleanGeneratedSources } from "./clean-generated-sources.js";

const WORKSPACE_PACKAGES = loadWorkspacePackages();

function packageDir(packageName: string): string {
  const pkg = WORKSPACE_PACKAGES[packageName];
  if (!pkg) {
    throw new Error(`Unknown workspace package: ${packageName}`);
  }
  return pkg.dir;
}

function packageHasScript(packageName: string, scriptName: string): boolean {
  const pkg = WORKSPACE_PACKAGES[packageName];
  return pkg ? Object.prototype.hasOwnProperty.call(pkg.scripts, scriptName) : false;
}

export async function buildPackageDirect(packageName: string): Promise<void> {
  const cwd = packageDir(packageName);
  await buildPackage(cwd);
}

export function typecheckPackageDirect(packageName: string): void {
  run(["node", TSC_BIN, "-p", "tsconfig.json", "--noEmit"], packageDir(packageName));
}

export function lintPackageDirect(packageName: string, fix: boolean): void {
  const cwd = packageDir(packageName);
  const candidates = ["src", "test", "index.ts", "shared.ts", "workspace.ts"];
  const targets = candidates
    .filter((candidate) => existsSync(path.join(cwd, candidate)))
    .map((candidate) => path.posix.join(path.relative(ROOT, cwd).split(path.sep).join(path.posix.sep), candidate));

  if (targets.length === 0) {
    return;
  }

  const configPath = path.join(ROOT, "packages", "eslint-config", "dist", "index.js");
  if (!existsSync(configPath) && packageName !== "@clover.js/eslint-config") {
    buildTargets(["@clover.js/eslint-config"]);
  }

  const configArgument = existsSync(configPath)
    ? configPath
    : path.join(ROOT, "packages", "eslint-config", "workspace.ts");

  const command = [
    "node",
    ESLINT_BIN,
    "--config",
    configArgument,
    ...targets,
    "--max-warnings=0"
  ];
  if (fix) {
    command.push("--fix");
  }
  run(command, ROOT);
}

export async function buildTargets(targets: readonly string[]): Promise<void> {
  for (const packageName of dependencyClosure(WORKSPACE_PACKAGES, targets)) {
    if (packageHasScript(packageName, "build")) {
      await buildPackageDirect(packageName);
    }
  }
}

export function typecheckTargets(targets: readonly string[]): void {
  for (const packageName of dependencyClosure(WORKSPACE_PACKAGES, targets)) {
    if (packageHasScript(packageName, "typecheck")) {
      typecheckPackageDirect(packageName);
    }
  }
}

export function lintTargets(targets: readonly string[], fix: boolean): void {
  for (const packageName of targets) {
    if (packageHasScript(packageName, "lint")) {
      lintPackageDirect(packageName, fix);
    }
  }
}

export async function buildAll(): Promise<void> {
  cleanGeneratedSources(ROOT);
  await buildTargets(Object.keys(WORKSPACE_PACKAGES).filter((packageName) => packageHasScript(packageName, "build")));
}

export function typecheckAll(): void {
  typecheckTargets(Object.keys(WORKSPACE_PACKAGES).filter((packageName) => packageHasScript(packageName, "typecheck")));
}

export function lintAll(): void {
  lintTargets(Object.keys(WORKSPACE_PACKAGES).filter((packageName) => packageHasScript(packageName, "lint")), false);
  run(
    [
      "node",
      ESLINT_BIN,
      "--config",
      path.join(ROOT, "packages", "eslint-config", "workspace.ts"),
      "bench",
      "tests",
      "--max-warnings=0"
    ],
    ROOT
  );
}

export function testUnit(): void {
  run([process.execPath, VITEST_BIN, "run", "--config", "vitest.unit.config.ts"]);
}

export function testSystem(): void {
  run([process.execPath, VITEST_BIN, "run", "--config", "vitest.system.config.ts"]);
}

export function testCoverage(): void {
  run([process.execPath, VITEST_BIN, "run", "--config", "vitest.unit.config.ts", "--coverage"]);
}

export async function runBench(ignoreBuild: boolean): Promise<void> {
  if (!ignoreBuild) {
    await buildAll();
  }
  run(["pnpm", "exec", "tsx", "./bench/index.ts"]);
}

export async function releaseCheck(): Promise<void> {
  lintAll();
  typecheckAll();
  await buildAll();
  testUnit();
  testSystem();
  run(["pnpm", "exec", "tsx", "./bench/index.ts"]);
}

export async function unittestPackage(
  cwd: string,
  coverage: boolean,
  ignoreBuild: boolean
): Promise<void> {
  const testDir = path.join(cwd, "test");
  if (!existsSync(testDir)) {
    return;
  }

  const packageName = packageNameFromDir(cwd);
  if (!ignoreBuild) {
    await buildTargets([packageName]);
  }

  const testFiles = readdirSync(testDir, { withFileTypes: true })
    .filter((dirent) => dirent.isFile() && dirent.name.endsWith(".test.ts"))
    .map((dirent) => path.posix.join(path.relative(ROOT, testDir).split(path.sep).join(path.posix.sep), dirent.name))
    .sort();

  if (testFiles.length === 0) {
    return;
  }

  const command = [
    process.execPath,
    VITEST_BIN,
    "run",
    ...testFiles,
    "--environment",
    "node",
    "--pool",
    "threads"
  ];
  if (coverage) {
    command.push("--coverage");
  }
  run(command);
}
