import type { ErrorPayload, Option, Result } from "@clover.js/protocol";

import type { AutomationGoal } from "./goal.js";

export const AutomationPlanNodeKind = {
  BuildPackage: "build-package",
  TestPackage: "test-package",
  LintWorkspace: "lint-workspace"
} as const;

export type AutomationPlanNodeKindValue =
  (typeof AutomationPlanNodeKind)[keyof typeof AutomationPlanNodeKind];

export const AutomationExecutionEventKind = {
  NodeStarted: "node-started",
  NodeCompleted: "node-completed",
  NodeFailed: "node-failed",
  NodeSkipped: "node-skipped"
} as const;

export type AutomationExecutionEventKindValue =
  (typeof AutomationExecutionEventKind)[keyof typeof AutomationExecutionEventKind];

export type WorkspacePackageSpec = {
  name: string;
  dependencies: readonly string[];
  canBuild: boolean;
  canTest: boolean;
  canLint: boolean;
};

export type WorkspacePackageManifest = {
  name: string;
  dependencies: Readonly<Record<string, string>>;
  devDependencies: Readonly<Record<string, string>>;
  scripts: Readonly<Record<string, string>>;
};

export type AutomationConfig = {
  packages: readonly WorkspacePackageSpec[];
  maxParallelism: number;
};

export type AutomationPolicy = {
  includeBuildDependencies: boolean;
  stopOnFirstFailure: boolean;
};

export type AutomationFacts = {
  completedNodeIds: readonly string[];
  failedNodeIds: readonly string[];
};

export type AutomationPlanNode = {
  id: string;
  kind: AutomationPlanNodeKindValue;
  packageName: Option<string>;
};

export type AutomationPlanEdge = {
  from: string;
  to: string;
};

export type AutomationExecutionPlan = {
  goal: AutomationGoal;
  nodes: readonly AutomationPlanNode[];
  edges: readonly AutomationPlanEdge[];
  targets: readonly string[];
};

export type AutomationTaskOutput = Readonly<Record<string, string | number | boolean>>;

export type AutomationExecutionEvent = {
  kind: AutomationExecutionEventKindValue;
  nodeId: string;
  code: number;
  detail: string;
};

export type AutomationExecutionReport = {
  ok: boolean;
  completedNodeIds: readonly string[];
  failedNodeIds: readonly string[];
  skippedNodeIds: readonly string[];
  outputs: Readonly<Record<string, AutomationTaskOutput>>;
  events: readonly AutomationExecutionEvent[];
};

export type AutomationExecutionSummary = {
  ok: boolean;
  completedCount: number;
  failedCount: number;
  skippedCount: number;
};

export type AutomationTaskRunner<Payload extends ErrorPayload = ErrorPayload> = (
  node: AutomationPlanNode
) => Promise<Result<AutomationTaskOutput, number, Payload>>;

export function createAutomationConfig(
  packages: readonly WorkspacePackageSpec[],
  maxParallelism: number
): AutomationConfig {
  return {
    packages,
    maxParallelism
  };
}

export function defaultAutomationPolicy(): AutomationPolicy {
  return {
    includeBuildDependencies: true,
    stopOnFirstFailure: true
  };
}

export function emptyAutomationFacts(): AutomationFacts {
  return {
    completedNodeIds: [],
    failedNodeIds: []
  };
}
