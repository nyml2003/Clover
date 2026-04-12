import type { AutomationConfig, WorkspacePackageManifest, WorkspacePackageSpec } from "./types.js";

function hasScript(
  scripts: Readonly<Record<string, string>>,
  scriptName: string
): boolean {
  return Object.prototype.hasOwnProperty.call(scripts, scriptName);
}

export function createWorkspacePackageManifest(
  name: string,
  dependencies: Readonly<Record<string, string>>,
  devDependencies: Readonly<Record<string, string>>,
  scripts: Readonly<Record<string, string>>
): WorkspacePackageManifest {
  return {
    name,
    dependencies,
    devDependencies,
    scripts
  };
}

export function createWorkspacePackageSpecFromManifest(
  manifest: WorkspacePackageManifest,
  workspacePackageNames: readonly string[]
): WorkspacePackageSpec {
  const dependencyNames = new Set<string>();

  for (const dependencyName of Object.keys(manifest.dependencies)) {
    if (workspacePackageNames.includes(dependencyName)) {
      dependencyNames.add(dependencyName);
    }
  }

  for (const dependencyName of Object.keys(manifest.devDependencies)) {
    if (workspacePackageNames.includes(dependencyName)) {
      dependencyNames.add(dependencyName);
    }
  }

  return {
    name: manifest.name,
    dependencies: [...dependencyNames].sort(),
    canBuild: hasScript(manifest.scripts, "build"),
    canTest: hasScript(manifest.scripts, "unittest"),
    canLint: hasScript(manifest.scripts, "lint")
  };
}

export function createAutomationConfigFromManifests(
  manifests: readonly WorkspacePackageManifest[],
  maxParallelism: number
): AutomationConfig {
  const workspacePackageNames = manifests.map((item) => item.name);
  const packages = manifests
    .map((item) => createWorkspacePackageSpecFromManifest(item, workspacePackageNames))
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    packages,
    maxParallelism
  };
}
