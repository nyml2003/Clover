export {
  AutomationGoalKind,
  buildPackageGoal,
  lintWorkspaceGoal,
  releaseCheckGoal,
  testPackageGoal
} from "./goal.js";
export type { AutomationGoal, AutomationGoalKindValue } from "./goal.js";
export { solveAutomationGoal, AutomationSolveErrorCode } from "./solve.js";
export { runAutomationPlan } from "./execute.js";
export {
  AutomationDiscoveryErrorCode,
  discoverWorkspacePackageManifests
} from "./discover.js";
export { planWorkspaceGoal } from "./plan-workspace.js";
export {
  createAutomationExecutionSummary,
  formatAutomationExecutionReport,
  toAutomationExitCode
} from "./report.js";
export {
  createAutomationConfigFromManifests,
  createWorkspacePackageManifest,
  createWorkspacePackageSpecFromManifest
} from "./workspace.js";
export {
  AutomationExecutionEventKind,
  createAutomationConfig,
  defaultAutomationPolicy,
  emptyAutomationFacts
} from "./types.js";
export type {
  AutomationConfig,
  AutomationExecutionEvent,
  AutomationExecutionPlan,
  AutomationExecutionReport,
  AutomationExecutionSummary,
  AutomationFacts,
  AutomationPlanEdge,
  AutomationPlanNode,
  AutomationPlanNodeKindValue,
  AutomationPolicy,
  AutomationTaskOutput,
  AutomationTaskRunner,
  WorkspacePackageManifest,
  WorkspacePackageSpec
} from "./types.js";
export type { AutomationSolveErrorPayload } from "./solve.js";
export type { AutomationDiscoveryErrorPayload } from "./discover.js";
export type { AutomationWorkspacePlanResult } from "./plan-workspace.js";
