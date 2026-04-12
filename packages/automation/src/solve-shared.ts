import { createError, isError, type Result } from "@clover.js/protocol";

import type { AutomationGoalKindValue } from "./goal.js";
import type {
  AutomationExecutionPlan,
  AutomationFacts,
  AutomationPlanEdge,
  AutomationPlanNode,
  WorkspacePackageSpec
} from "./types.js";

export const AutomationSolveErrorCode = {
  UnknownPackage: 6101,
  MissingCapability: 6102,
  DependencyCycle: 6103
} as const;

export type AutomationSolveErrorCodeValue =
  (typeof AutomationSolveErrorCode)[keyof typeof AutomationSolveErrorCode];

export type AutomationSolveErrorPayload = {
  reason: string;
  goalKind: string;
  packageName: string;
  detail: string;
};

export type AutomationSolveResult<T> = Result<
  T,
  AutomationSolveErrorCodeValue,
  AutomationSolveErrorPayload
>;

export function createSolveError(
  code: AutomationSolveErrorCodeValue,
  reason: string,
  goalKind: string,
  packageName: string,
  detail: string
): Result<never, AutomationSolveErrorCodeValue, AutomationSolveErrorPayload> {
  return createError(code, {
    reason,
    goalKind,
    packageName,
    detail
  });
}

export function packageIndex(
  packages: readonly WorkspacePackageSpec[]
): Readonly<Record<string, WorkspacePackageSpec>> {
  const index: Record<string, WorkspacePackageSpec> = {};

  for (const item of packages) {
    index[item.name] = item;
  }

  return index;
}

export function requirePackage(
  index: Readonly<Record<string, WorkspacePackageSpec>>,
  packageName: string,
  goalKind: AutomationGoalKindValue
): WorkspacePackageSpec | Result<never, AutomationSolveErrorCodeValue, AutomationSolveErrorPayload> {
  const item = index[packageName];
  if (item) {
    return item;
  }

  return createSolveError(
    AutomationSolveErrorCode.UnknownPackage,
    "unknown-package",
    goalKind,
    packageName,
    packageName
  );
}

export function assertCapability(
  item: WorkspacePackageSpec,
  goalKind: AutomationGoalKindValue,
  canRun: boolean
): WorkspacePackageSpec | Result<never, AutomationSolveErrorCodeValue, AutomationSolveErrorPayload> {
  if (canRun) {
    return item;
  }

  return createSolveError(
    AutomationSolveErrorCode.MissingCapability,
    "missing-capability",
    goalKind,
    item.name,
    item.name
  );
}

export function dependencyClosure(
  packageName: string,
  index: Readonly<Record<string, WorkspacePackageSpec>>,
  goalKind: AutomationGoalKindValue
): AutomationSolveResult<readonly string[]> {
  const seen = new Set<string>();
  const visiting = new Set<string>();
  const ordered: string[] = [];

  function visit(targetName: string): AutomationSolveResult<true> {
    if (seen.has(targetName)) {
      return true;
    }

    if (visiting.has(targetName)) {
      return createSolveError(
        AutomationSolveErrorCode.DependencyCycle,
        "dependency-cycle",
        goalKind,
        targetName,
        targetName
      );
    }

    const item = requirePackage(index, targetName, goalKind);
    if (isError(item)) {
      return item;
    }

    visiting.add(targetName);

    for (const dependencyName of item.dependencies) {
      const result = visit(dependencyName);
      if (isError(result)) {
        return result;
      }
    }

    visiting.delete(targetName);
    seen.add(targetName);
    ordered.push(targetName);
    return true;
  }

  const result = visit(packageName);
  if (isError(result)) {
    return result;
  }

  return ordered;
}

export function terminalNodeIds(
  nodes: readonly AutomationPlanNode[],
  edges: readonly AutomationPlanEdge[]
): readonly string[] {
  const fromIds = new Set<string>();

  for (const edge of edges) {
    fromIds.add(edge.from);
  }

  return nodes
    .map((node) => node.id)
    .filter((nodeId) => !fromIds.has(nodeId))
    .sort();
}

export function pruneCompleted(
  plan: AutomationExecutionPlan,
  facts: AutomationFacts
): AutomationExecutionPlan {
  const completed = new Set(facts.completedNodeIds);
  const nodes = plan.nodes.filter((node) => !completed.has(node.id));
  const activeNodeIds = new Set(nodes.map((node) => node.id));
  const edges = plan.edges.filter(
    (edge) => activeNodeIds.has(edge.from) && activeNodeIds.has(edge.to)
  );
  const targets = plan.targets.filter((target) => activeNodeIds.has(target));

  return {
    goal: plan.goal,
    nodes,
    edges,
    targets
  };
}
