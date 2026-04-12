import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { createError, type Result } from "@clover.js/protocol";

import type { WorkspacePackageManifest } from "./types.js";
import { createWorkspacePackageManifest } from "./workspace.js";

export const AutomationDiscoveryErrorCode = {
  PackagesDirectoryMissing: 6201,
  InvalidManifest: 6202
} as const;

type AutomationDiscoveryErrorCodeValue =
  (typeof AutomationDiscoveryErrorCode)[keyof typeof AutomationDiscoveryErrorCode];

export type AutomationDiscoveryErrorPayload = {
  reason: string;
  path: string;
};

type PackageJsonRecord = Readonly<Record<string, unknown>>;

function createDiscoveryError(
  code: AutomationDiscoveryErrorCodeValue,
  reason: string,
  path: string
) {
  return createError(code, {
    reason,
    path
  });
}

function isRecord(value: unknown): value is PackageJsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readStringRecord(value: unknown): Readonly<Record<string, string>> {
  if (!isRecord(value)) {
    return {};
  }

  const output: Record<string, string> = {};

  for (const key of Object.keys(value)) {
    const candidate = value[key];
    if (typeof candidate === "string") {
      output[key] = candidate;
    }
  }

  return output;
}

function parseWorkspaceManifest(path: string): Result<
  WorkspacePackageManifest,
  AutomationDiscoveryErrorCodeValue,
  AutomationDiscoveryErrorPayload
> {
  const parsed = JSON.parse(readFileSync(path, "utf-8")) as unknown;
  if (!isRecord(parsed) || typeof parsed["name"] !== "string") {
    return createDiscoveryError(
      AutomationDiscoveryErrorCode.InvalidManifest,
      "invalid-manifest",
      path
    );
  }

  return createWorkspacePackageManifest(
    parsed["name"],
    readStringRecord(parsed["dependencies"]),
    readStringRecord(parsed["devDependencies"]),
    readStringRecord(parsed["scripts"])
  );
}

export function discoverWorkspacePackageManifests(
  rootDir: string,
  packagesDir: string
): Result<
  readonly WorkspacePackageManifest[],
  AutomationDiscoveryErrorCodeValue,
  AutomationDiscoveryErrorPayload
> {
  const absolutePackagesDir = join(rootDir, packagesDir);

  try {
    if (!statSync(absolutePackagesDir).isDirectory()) {
      return createDiscoveryError(
        AutomationDiscoveryErrorCode.PackagesDirectoryMissing,
        "packages-directory-missing",
        absolutePackagesDir
      );
    }
  } catch {
    return createDiscoveryError(
      AutomationDiscoveryErrorCode.PackagesDirectoryMissing,
      "packages-directory-missing",
      absolutePackagesDir
    );
  }

  const manifests: WorkspacePackageManifest[] = [];
  const packageDirs = readdirSync(absolutePackagesDir, {
    withFileTypes: true
  })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const packageDir of packageDirs) {
    const packageJsonPath = join(absolutePackagesDir, packageDir, "package.json");

    try {
      if (!statSync(packageJsonPath).isFile()) {
        continue;
      }
    } catch {
      continue;
    }

    const manifest = parseWorkspaceManifest(packageJsonPath);
    if ("__code__" in manifest) {
      return manifest;
    }

    manifests.push(manifest);
  }

  return manifests;
}
