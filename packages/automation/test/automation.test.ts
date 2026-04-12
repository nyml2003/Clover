import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { None, createError } from "@clover.js/protocol";
import {
  AutomationExecutionEventKind,
  AutomationDiscoveryErrorCode,
  AutomationGoalKind,
  AutomationSolveErrorCode,
  buildPackageGoal,
  createAutomationConfig,
  createAutomationExecutionSummary,
  createAutomationConfigFromManifests,
  discoverWorkspacePackageManifests,
  planWorkspaceGoal,
  createWorkspacePackageManifest,
  defaultAutomationPolicy,
  emptyAutomationFacts,
  formatAutomationExecutionReport,
  lintWorkspaceGoal,
  releaseCheckGoal,
  runAutomationPlan,
  solveAutomationGoal,
  testPackageGoal
} from "@clover.js/automation";

const workspaceConfig = createAutomationConfig(
  [
    {
      name: "@clover.js/protocol",
      dependencies: [],
      canBuild: true,
      canTest: false,
      canLint: true
    },
    {
      name: "@clover.js/std",
      dependencies: ["@clover.js/protocol"],
      canBuild: true,
      canTest: false,
      canLint: true
    },
    {
      name: "@clover.js/zod",
      dependencies: ["@clover.js/protocol", "@clover.js/std"],
      canBuild: true,
      canTest: false,
      canLint: true
    },
    {
      name: "@clover.js/http",
      dependencies: ["@clover.js/protocol", "@clover.js/std", "@clover.js/zod"],
      canBuild: true,
      canTest: true,
      canLint: true
    }
  ],
  2
);

const AutomationTestErrorCode = {
  BuildFailed: 9001
} as const;

describe("@clover.js/automation", () => {
  it("solves build goals by expanding dependency closure into a DAG", () => {
    const plan = solveAutomationGoal(
      buildPackageGoal("@clover.js/http"),
      workspaceConfig,
      defaultAutomationPolicy(),
      emptyAutomationFacts()
    );

    expect(plan).toEqual({
      goal: {
        kind: AutomationGoalKind.BuildPackage,
        packageName: "@clover.js/http"
      },
      nodes: [
        {
          id: "build-package:@clover.js/protocol",
          kind: "build-package",
          packageName: "@clover.js/protocol"
        },
        {
          id: "build-package:@clover.js/std",
          kind: "build-package",
          packageName: "@clover.js/std"
        },
        {
          id: "build-package:@clover.js/zod",
          kind: "build-package",
          packageName: "@clover.js/zod"
        },
        {
          id: "build-package:@clover.js/http",
          kind: "build-package",
          packageName: "@clover.js/http"
        }
      ],
      edges: [
        {
          from: "build-package:@clover.js/protocol",
          to: "build-package:@clover.js/std"
        },
        {
          from: "build-package:@clover.js/protocol",
          to: "build-package:@clover.js/zod"
        },
        {
          from: "build-package:@clover.js/std",
          to: "build-package:@clover.js/zod"
        },
        {
          from: "build-package:@clover.js/protocol",
          to: "build-package:@clover.js/http"
        },
        {
          from: "build-package:@clover.js/std",
          to: "build-package:@clover.js/http"
        },
        {
          from: "build-package:@clover.js/zod",
          to: "build-package:@clover.js/http"
        }
      ],
      targets: ["build-package:@clover.js/http"]
    });
  });

  it("solves test goals by adding the target test node after build", () => {
    const plan = solveAutomationGoal(
      testPackageGoal("@clover.js/http"),
      workspaceConfig,
      defaultAutomationPolicy(),
      emptyAutomationFacts()
    );

    expect(plan).not.toHaveProperty("__code__");
    if ("__code__" in plan) {
      return;
    }

    expect(plan.targets).toEqual(["test-package:@clover.js/http"]);
    expect(plan.nodes.some((node) => node.id === "test-package:@clover.js/http")).toBe(true);
    expect(
      plan.edges.some(
        (edge) =>
          edge.from === "build-package:@clover.js/http" &&
          edge.to === "test-package:@clover.js/http"
      )
    ).toBe(true);
  });

  it("solves release-check by combining lint, build and test nodes", () => {
    const plan = solveAutomationGoal(
      releaseCheckGoal(),
      workspaceConfig,
      defaultAutomationPolicy(),
      emptyAutomationFacts()
    );

    expect(plan).not.toHaveProperty("__code__");
    if ("__code__" in plan) {
      return;
    }

    expect(plan.nodes.some((node) => node.id === "lint-workspace")).toBe(true);
    expect(plan.nodes.some((node) => node.id === "test-package:@clover.js/http")).toBe(true);
    expect(plan.targets).toContain("lint-workspace");
    expect(plan.targets).toContain("test-package:@clover.js/http");
  });

  it("returns Clover errors for unknown packages", () => {
    const result = solveAutomationGoal(
      buildPackageGoal("@clover.js/missing"),
      workspaceConfig,
      defaultAutomationPolicy(),
      emptyAutomationFacts()
    );

    expect(result).toEqual(
      createError(AutomationSolveErrorCode.UnknownPackage, {
        reason: "unknown-package",
        goalKind: "build-package",
        packageName: "@clover.js/missing",
        detail: "@clover.js/missing"
      })
    );
  });

  it("derives automation config from workspace manifests", () => {
    const config = createAutomationConfigFromManifests(
      [
        createWorkspacePackageManifest(
          "@clover.js/protocol",
          {},
          {},
          {
            build: "pnpm build",
            lint: "pnpm lint"
          }
        ),
        createWorkspacePackageManifest(
          "@clover.js/http",
          {
            "@clover.js/protocol": "workspace:*"
          },
          {
            vitest: "^4.1.4"
          },
          {
            build: "pnpm build",
            lint: "pnpm lint",
            unittest: "pnpm test"
          }
        )
      ],
      4
    );

    expect(config).toEqual({
      packages: [
        {
          name: "@clover.js/http",
          dependencies: ["@clover.js/protocol"],
          canBuild: true,
          canTest: true,
          canLint: true
        },
        {
          name: "@clover.js/protocol",
          dependencies: [],
          canBuild: true,
          canTest: false,
          canLint: true
        }
      ],
      maxParallelism: 4
    });
  });

  it("discovers workspace manifests from a packages directory", () => {
    const rootDir = mkdtempSync(join(tmpdir(), "clover-automation-"));
    const packagesDir = join(rootDir, "packages");
    const protocolDir = join(packagesDir, "protocol");
    const httpDir = join(packagesDir, "http");

    mkdirSync(protocolDir, { recursive: true });
    mkdirSync(httpDir, { recursive: true });

    writeFileSync(
      join(protocolDir, "package.json"),
      JSON.stringify(
        {
          name: "@clover.js/protocol",
          dependencies: {},
          devDependencies: {},
          scripts: {
            build: "pnpm build",
            lint: "pnpm lint"
          }
        },
        null,
        2
      ),
      "utf-8"
    );
    writeFileSync(
      join(httpDir, "package.json"),
      JSON.stringify(
        {
          name: "@clover.js/http",
          dependencies: {
            "@clover.js/protocol": "workspace:*"
          },
          devDependencies: {},
          scripts: {
            build: "pnpm build",
            lint: "pnpm lint",
            unittest: "pnpm test"
          }
        },
        null,
        2
      ),
      "utf-8"
    );

    expect(discoverWorkspacePackageManifests(rootDir, "packages")).toEqual([
      createWorkspacePackageManifest(
        "@clover.js/http",
        {
          "@clover.js/protocol": "workspace:*"
        },
        {},
        {
          build: "pnpm build",
          lint: "pnpm lint",
          unittest: "pnpm test"
        }
      ),
      createWorkspacePackageManifest(
        "@clover.js/protocol",
        {},
        {},
        {
          build: "pnpm build",
          lint: "pnpm lint"
        }
      )
    ]);
  });

  it("returns Clover errors for missing packages directories", () => {
    const rootDir = mkdtempSync(join(tmpdir(), "clover-automation-"));

    expect(discoverWorkspacePackageManifests(rootDir, "packages")).toEqual(
      createError(AutomationDiscoveryErrorCode.PackagesDirectoryMissing, {
        reason: "packages-directory-missing",
        path: join(rootDir, "packages")
      })
    );
  });

  it("plans a workspace goal from discovered manifests", () => {
    const rootDir = mkdtempSync(join(tmpdir(), "clover-automation-"));
    const packagesDir = join(rootDir, "packages");
    const protocolDir = join(packagesDir, "protocol");
    const httpDir = join(packagesDir, "http");

    mkdirSync(protocolDir, { recursive: true });
    mkdirSync(httpDir, { recursive: true });

    writeFileSync(
      join(protocolDir, "package.json"),
      JSON.stringify(
        {
          name: "@clover.js/protocol",
          dependencies: {},
          devDependencies: {},
          scripts: {
            build: "pnpm build",
            lint: "pnpm lint"
          }
        },
        null,
        2
      ),
      "utf-8"
    );
    writeFileSync(
      join(httpDir, "package.json"),
      JSON.stringify(
        {
          name: "@clover.js/http",
          dependencies: {
            "@clover.js/protocol": "workspace:*"
          },
          devDependencies: {},
          scripts: {
            build: "pnpm build",
            lint: "pnpm lint",
            unittest: "pnpm test"
          }
        },
        null,
        2
      ),
      "utf-8"
    );

    const plan = planWorkspaceGoal(
      rootDir,
      "packages",
      buildPackageGoal("@clover.js/http"),
      2,
      defaultAutomationPolicy(),
      emptyAutomationFacts()
    );

    expect(plan).not.toHaveProperty("__code__");
    if ("__code__" in plan) {
      return;
    }

    expect(plan.targets).toEqual(["build-package:@clover.js/http"]);
    expect(plan.nodes).toEqual([
      {
        id: "build-package:@clover.js/protocol",
        kind: "build-package",
        packageName: "@clover.js/protocol"
      },
      {
        id: "build-package:@clover.js/http",
        kind: "build-package",
        packageName: "@clover.js/http"
      }
    ]);
  });

  it("creates a lint-workspace plan with a single workspace node", () => {
    const plan = solveAutomationGoal(
      lintWorkspaceGoal(),
      workspaceConfig,
      defaultAutomationPolicy(),
      emptyAutomationFacts()
    );

    expect(plan).toEqual({
      goal: {
        kind: AutomationGoalKind.LintWorkspace
      },
      nodes: [
        {
          id: "lint-workspace",
          kind: "lint-workspace",
          packageName: None
        }
      ],
      edges: [],
      targets: ["lint-workspace"]
    });
  });

  it("runs a solved plan and records completion events", async () => {
    const plan = solveAutomationGoal(
      buildPackageGoal("@clover.js/http"),
      workspaceConfig,
      defaultAutomationPolicy(),
      emptyAutomationFacts()
    );
    if ("__code__" in plan) {
      expect.unreachable();
      return;
    }

    const report = await runAutomationPlan(
      plan,
      workspaceConfig,
      defaultAutomationPolicy(),
      async (node) => ({
        nodeId: node.id,
        order: 1
      })
    );

    expect(report.ok).toBe(true);
    expect(report.failedNodeIds).toEqual([]);
    expect(report.skippedNodeIds).toEqual([]);
    expect(report.completedNodeIds).toEqual([
      "build-package:@clover.js/http",
      "build-package:@clover.js/protocol",
      "build-package:@clover.js/std",
      "build-package:@clover.js/zod"
    ]);
    expect(
      report.events.some((event) => event.kind === AutomationExecutionEventKind.NodeStarted)
    ).toBe(true);
    expect(
      report.events.some((event) => event.kind === AutomationExecutionEventKind.NodeCompleted)
    ).toBe(true);
  });

  it("stops and marks remaining nodes as skipped when failure propagation is enabled", async () => {
    const plan = solveAutomationGoal(
      testPackageGoal("@clover.js/http"),
      workspaceConfig,
      defaultAutomationPolicy(),
      emptyAutomationFacts()
    );
    if ("__code__" in plan) {
      expect.unreachable();
      return;
    }

    const report = await runAutomationPlan(
      plan,
      workspaceConfig,
      defaultAutomationPolicy(),
      async (node) => {
        if (node.id === "build-package:@clover.js/std") {
          return createError(AutomationTestErrorCode.BuildFailed, {
            reason: "build-failed"
          });
        }

        return {
          nodeId: node.id,
          order: 1
        };
      }
    );

    expect(report.ok).toBe(false);
    expect(report.failedNodeIds).toEqual(["build-package:@clover.js/std"]);
    expect(report.skippedNodeIds).toContain("build-package:@clover.js/http");
    expect(report.skippedNodeIds).toContain("build-package:@clover.js/zod");
    expect(report.skippedNodeIds).toContain("test-package:@clover.js/http");
    expect(
      report.events.some(
        (event) =>
          event.kind === AutomationExecutionEventKind.NodeFailed &&
          event.nodeId === "build-package:@clover.js/std"
      )
    ).toBe(true);
  });

  it("summarizes and formats execution reports for egress adapters", () => {
    const report = {
      ok: false,
      completedNodeIds: ["build-package:@clover.js/protocol"],
      failedNodeIds: ["build-package:@clover.js/std"],
      skippedNodeIds: ["build-package:@clover.js/http"],
      outputs: {
        "build-package:@clover.js/protocol": {
          exitCode: 0
        }
      },
      events: []
    };

    expect(createAutomationExecutionSummary(report)).toEqual({
      ok: false,
      completedCount: 1,
      failedCount: 1,
      skippedCount: 1
    });

    expect(formatAutomationExecutionReport(report)).toEqual([
      "ok=false",
      "completed=1",
      "failed=1",
      "skipped=1",
      "failed-node=build-package:@clover.js/std",
      "skipped-node=build-package:@clover.js/http"
    ]);
  });
});
