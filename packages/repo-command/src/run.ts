import {
  formatAutomationExecutionReport,
  planWorkspaceGoal,
  runAutomationPlan,
  toAutomationExitCode
} from "@clover.js/automation";
import { formatCliError, readArgv } from "@clover.js/cli";
import { isError } from "@clover.js/protocol";

import { parseRepoCommandGoal } from "./parse.js";
import type { RepoCommandEnvironment, RepoCommandRenderResult, RepoCommandRunner } from "./types.js";

export async function runRepoCommand(
  argv: readonly string[],
  environment: RepoCommandEnvironment,
  runNode: RepoCommandRunner
): Promise<RepoCommandRenderResult> {
  const args = readArgv(argv);
  const goal = parseRepoCommandGoal(args);

  if (isError(goal)) {
    return {
      ok: false,
      exitCode: 1,
      stdout: "",
      stderr: goal.payload.usage
    };
  }

  const plan = planWorkspaceGoal(
    environment.rootDir,
    environment.packagesDir,
    goal,
    environment.maxParallelism,
    environment.policy,
    environment.facts
  );
  if (isError(plan)) {
    return {
      ok: false,
      exitCode: 1,
      stdout: "",
      stderr: formatCliError(plan)
    };
  }

  const report = await runAutomationPlan(plan, {
    packages: [],
    maxParallelism: environment.maxParallelism
  }, environment.policy, runNode);
  const lines = formatAutomationExecutionReport(report).join("\n");

  return report.ok
    ? {
        ok: true,
        exitCode: 0,
        stdout: lines,
        stderr: ""
      }
    : {
        ok: false,
        exitCode: toAutomationExitCode(report),
        stdout: "",
        stderr: lines
      };
}
