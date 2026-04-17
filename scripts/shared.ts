import { readdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

export const ROOT = path.resolve(import.meta.dirname, "..");
export const PACKAGES_DIR = path.join(ROOT, "packages");
export const ESLINT_BIN = path.join(ROOT, "node_modules", "eslint", "bin", "eslint.js");
export const TSC_BIN = path.join(ROOT, "node_modules", "typescript", "lib", "tsc.js");
const vitestPackageJson = loadJsonObject(path.join(ROOT, "node_modules", "vitest", "package.json"));
const vitestBin = readObject(vitestPackageJson, "bin")["vitest"];
export const VITEST_BIN = path.join(
  ROOT,
  "node_modules",
  "vitest",
  readString(vitestBin, "vitest bin")
);

type JsonValue =
  | null
  | boolean
  | number
  | string
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

type JsonObject = { readonly [key: string]: JsonValue };

export type WorkspacePackage = {
  dir: string;
  dependencies: Readonly<Record<string, string>>;
  scripts: Readonly<Record<string, string>>;
};

export function normalizeCommand(command: readonly string[]): readonly string[] {
  if (process.platform === "win32" && command[0] === "pnpm") {
    return ["pnpm.cmd", ...command.slice(1)];
  }

  return command;
}

export function run(command: readonly string[], cwd: string = ROOT): void {
  const resolved = normalizeCommand(command);
  const completed = spawnSync(resolved[0], resolved.slice(1), {
    cwd,
    stdio: "inherit"
  });

  if (completed.status !== 0) {
    throw new Error(`Command failed: ${resolved.join(" ")}`);
  }
}

export function loadJsonObject(filePath: string): JsonObject {
  const loaded = JSON.parse(readFileSync(filePath, "utf8")) as JsonValue;
  if (loaded === null || Array.isArray(loaded) || typeof loaded !== "object") {
    throw new Error(`Expected JSON object in ${filePath}`);
  }

  return loaded;
}

export function readString(value: JsonValue | undefined, fieldName: string): string {
  if (typeof value !== "string") {
    throw new Error(`Expected string for ${fieldName}`);
  }

  return value;
}

export function readObject(
  source: JsonObject,
  fieldName: string
): Readonly<Record<string, JsonValue>> {
  const value = source[fieldName];
  if (value === undefined) {
    return {};
  }
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    throw new Error(`Expected object for ${fieldName}`);
  }

  return value;
}

export function loadWorkspacePackages(): Readonly<Record<string, WorkspacePackage>> {
  const entries = new Map<string, WorkspacePackage>();

  for (const dirent of readdirSync(PACKAGES_DIR, { withFileTypes: true })) {
    if (!dirent.isDirectory()) {
      continue;
    }

    const packageDir = path.join(PACKAGES_DIR, dirent.name);
    const packageJsonPath = path.join(packageDir, "package.json");
    try {
      const packageJson = loadJsonObject(packageJsonPath);
      const packageName = readString(packageJson["name"], "name");
      const dependencies = {
        ...toStringRecord(readObject(packageJson, "dependencies")),
        ...toStringRecord(readObject(packageJson, "devDependencies"))
      };
      const scripts = toStringRecord(readObject(packageJson, "scripts"));
      entries.set(packageName, {
        dir: packageDir,
        dependencies,
        scripts
      });
    } catch {
      continue;
    }
  }

  return Object.fromEntries(entries);
}

function toStringRecord(source: Readonly<Record<string, JsonValue>>): Readonly<Record<string, string>> {
  const entries: Array<[string, string]> = [];
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === "string") {
      entries.push([key, value]);
    }
  }
  return Object.fromEntries(entries);
}

export function dependencyClosure(
  workspacePackages: Readonly<Record<string, WorkspacePackage>>,
  targets: readonly string[]
): readonly string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  const visit = (packageName: string): void => {
    if (seen.has(packageName)) {
      return;
    }

    seen.add(packageName);
    const pkg = workspacePackages[packageName];
    if (!pkg) {
      throw new Error(`Unknown workspace package: ${packageName}`);
    }

    for (const dependencyName of Object.keys(pkg.dependencies)) {
      if (workspacePackages[dependencyName]) {
        visit(dependencyName);
      }
    }

    ordered.push(packageName);
  };

  for (const target of targets) {
    visit(target);
  }

  return ordered;
}

export function kebabCase(value: string): string {
  const parts: string[] = [];
  for (const char of value) {
    if (char === "_") {
      parts.push("-");
      continue;
    }
    if (char >= "A" && char <= "Z") {
      parts.push("-", char.toLowerCase());
      continue;
    }
    parts.push(char);
  }
  return parts.join("");
}

export function mergeObjects(
  base: Readonly<Record<string, JsonValue>>,
  override: Readonly<Record<string, JsonValue>>
): Readonly<Record<string, JsonValue>> {
  const merged: Record<string, JsonValue> = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const current = merged[key];
    if (isJsonObject(current) && isJsonObject(value)) {
      merged[key] = mergeObjects(current, value);
      continue;
    }

    merged[key] = value;
  }

  return merged;
}

function isJsonObject(value: JsonValue | undefined): value is JsonObject {
  return value !== null && value !== undefined && !Array.isArray(value) && typeof value === "object";
}

export function packageNameFromDir(cwd: string): string {
  const packageJson = loadJsonObject(path.join(cwd, "package.json"));
  return readString(packageJson["name"], "name");
}
