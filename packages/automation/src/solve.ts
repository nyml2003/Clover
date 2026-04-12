import { None, isError, type Option } from "@clover.js/protocol";

import {
  AutomationGoalKind,
  type AutomationGoal
} from "./goal.js";
import {
  AutomationPlanNodeKind,
  type AutomationConfig,
  type AutomationExecutionPlan,
  type AutomationFacts,
  type AutomationPlanEdge,
  type AutomationPlanNode,
  type AutomationPolicy
} from "./types.js";
import {
  type AutomationSolveResult,
  assertCapability,
  dependencyClosure,
  packageIndex,
  pruneCompleted,
  requirePackage,
  terminalNodeIds
} from "./solve-shared.js";
export {
  AutomationSolveErrorCode,
  type AutomationSolveErrorPayload
} from "./solve-shared.js";

const LINT_WORKSPACE_NODE_ID = "lint-workspace";

function nodeIdForBuild(packageName: string): string {
  return `${AutomationPlanNodeKind.BuildPackage}:${packageName}`;
}

function nodeIdForTest(packageName: string): string {
  return `${AutomationPlanNodeKind.TestPackage}:${packageName}`;
}

function createNode(
  id: string,
  kind: AutomationPlanNode["kind"],
  packageName: Option<string>
): AutomationPlanNode {
  return {
    id,
    kind,
    packageName
  };
}

function solveBuildPackageGoal(
  goal: Extract<AutomationGoal, { kind: typeof AutomationGoalKind.BuildPackage }>,
  index: ReturnType<typeof packageIndex>,
  policy: AutomationPolicy
): AutomationSolveResult<AutomationExecutionPlan> {
  const item = requirePackage(index, goal.packageName, goal.kind);
  if (isError(item)) {
    return item;
  }

  const capability = assertCapability(item, goal.kind, item.canBuild);
  if (isError(capability)) {
    return capability;
  }

  const packages = policy.includeBuildDependencies
    ? dependencyClosure(goal.packageName, index, goal.kind)
    : [goal.packageName];
  if (isError(packages)) {
    return packages;
  }

  const nodes = packages.map((packageName) =>
    createNode(nodeIdForBuild(packageName), AutomationPlanNodeKind.BuildPackage, packageName)
  );
  const edges: AutomationPlanEdge[] = [];

  for (const packageName of packages) {
    const current = index[packageName];
    if (!current) {
      continue;
    }

    for (const dependencyName of current.dependencies) {
      if (packages.includes(dependencyName)) {
        edges.push({
          from: nodeIdForBuild(dependencyName),
          to: nodeIdForBuild(packageName)
        });
      }
    }
  }

  return {
    goal,
    nodes,
    edges,
    targets: [nodeIdForBuild(goal.packageName)]
  };
}

function solveTestPackageGoal(
  goal: Extract<AutomationGoal, { kind: typeof AutomationGoalKind.TestPackage }>,
  index: ReturnType<typeof packageIndex>,
  policy: AutomationPolicy
): AutomationSolveResult<AutomationExecutionPlan> {
  const item = requirePackage(index, goal.packageName, goal.kind);
  if (isError(item)) {
    return item;
  }

  const capability = assertCapability(item, goal.kind, item.canTest);
  if (isError(capability)) {
    return capability;
  }

  const buildPlan = item.canBuild
    ? solveBuildPackageGoal(
        {
          kind: AutomationGoalKind.BuildPackage,
          packageName: goal.packageName
        },
        index,
        policy
      )
    : {
        goal: {
          kind: AutomationGoalKind.BuildPackage,
          packageName: goal.packageName
        },
        nodes: [],
        edges: [],
        targets: []
      };
  if (isError(buildPlan)) {
    return buildPlan;
  }

  const testNode = createNode(
    nodeIdForTest(goal.packageName),
    AutomationPlanNodeKind.TestPackage,
    goal.packageName
  );
  const edges = [...buildPlan.edges];

  if (item.canBuild) {
    edges.push({
      from: nodeIdForBuild(goal.packageName),
      to: nodeIdForTest(goal.packageName)
    });
  }

  return {
    goal,
    nodes: [...buildPlan.nodes, testNode],
    edges,
    targets: [nodeIdForTest(goal.packageName)]
  };
}

function solveLintWorkspaceGoal(
  goal: Extract<AutomationGoal, { kind: typeof AutomationGoalKind.LintWorkspace }>,
  config: AutomationConfig
): AutomationExecutionPlan {
  const hasLintable = config.packages.some((item) => item.canLint);

  return {
    goal,
    nodes: hasLintable
      ? [createNode(LINT_WORKSPACE_NODE_ID, AutomationPlanNodeKind.LintWorkspace, None)]
      : [],
    edges: [],
    targets: hasLintable ? [LINT_WORKSPACE_NODE_ID] : []
  };
}

function solveReleaseCheckGoal(
  goal: Extract<AutomationGoal, { kind: typeof AutomationGoalKind.ReleaseCheck }>,
  config: AutomationConfig,
  index: ReturnType<typeof packageIndex>,
  policy: AutomationPolicy
): AutomationSolveResult<AutomationExecutionPlan> {
  const allBuildable = [...config.packages]
    .filter((item) => item.canBuild)
    .map((item) => item.name)
    .sort();
  const buildNodes: AutomationPlanNode[] = [];
  const buildEdges: AutomationPlanEdge[] = [];
  const buildNodeIds = new Set<string>();

  for (const packageName of allBuildable) {
    const solved = solveBuildPackageGoal(
      {
        kind: AutomationGoalKind.BuildPackage,
        packageName
      },
      index,
      policy
    );
    if (isError(solved)) {
      return solved;
    }

    for (const node of solved.nodes) {
      if (!buildNodeIds.has(node.id)) {
        buildNodes.push(node);
        buildNodeIds.add(node.id);
      }
    }

    for (const edge of solved.edges) {
      buildEdges.push(edge);
    }
  }

  const testNodes: AutomationPlanNode[] = [];
  const testEdges: AutomationPlanEdge[] = [];

  for (const item of config.packages) {
    if (!item.canTest) {
      continue;
    }

    testNodes.push(
      createNode(nodeIdForTest(item.name), AutomationPlanNodeKind.TestPackage, item.name)
    );

    if (item.canBuild) {
      testEdges.push({
        from: nodeIdForBuild(item.name),
        to: nodeIdForTest(item.name)
      });
    }
  }

  const lintPlan = solveLintWorkspaceGoal(
    {
      kind: AutomationGoalKind.LintWorkspace
    },
    config
  );

  const nodes = [...buildNodes, ...testNodes, ...lintPlan.nodes];
  const edges = [...buildEdges, ...testEdges, ...lintPlan.edges];

  return {
    goal,
    nodes,
    edges,
    targets: terminalNodeIds(nodes, edges)
  };
}

export function solveAutomationGoal(
  goal: AutomationGoal,
  config: AutomationConfig,
  policy: AutomationPolicy,
  facts: AutomationFacts
): AutomationSolveResult<AutomationExecutionPlan> {
  const index = packageIndex(config.packages);
  const solved =
    goal.kind === AutomationGoalKind.BuildPackage
      ? solveBuildPackageGoal(goal, index, policy)
      : goal.kind === AutomationGoalKind.TestPackage
        ? solveTestPackageGoal(goal, index, policy)
        : goal.kind === AutomationGoalKind.LintWorkspace
          ? solveLintWorkspaceGoal(goal, config)
          : solveReleaseCheckGoal(goal, config, index, policy);

  if (isError(solved)) {
    return solved;
  }

  return pruneCompleted(solved, facts);
}
