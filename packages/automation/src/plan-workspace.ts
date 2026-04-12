import type { Result } from "@clover.js/protocol";

import type { AutomationGoal } from "./goal.js";
import type { AutomationDiscoveryErrorPayload } from "./discover.js";
import { discoverWorkspacePackageManifests } from "./discover.js";
import type { AutomationSolveErrorPayload } from "./solve.js";
import { solveAutomationGoal } from "./solve.js";
import type {
  AutomationExecutionPlan,
  AutomationFacts,
  AutomationPolicy
} from "./types.js";
import { createAutomationConfigFromManifests } from "./workspace.js";

export type AutomationWorkspacePlanResult = Result<
  AutomationExecutionPlan,
  number,
  AutomationDiscoveryErrorPayload | AutomationSolveErrorPayload
>;

export function planWorkspaceGoal(
  rootDir: string,
  packagesDir: string,
  goal: AutomationGoal,
  maxParallelism: number,
  policy: AutomationPolicy,
  facts: AutomationFacts
): AutomationWorkspacePlanResult {
  const manifests = discoverWorkspacePackageManifests(rootDir, packagesDir);
  if ("__code__" in manifests) {
    return manifests;
  }

  const config = createAutomationConfigFromManifests(manifests, maxParallelism);
  return solveAutomationGoal(goal, config, policy, facts);
}
