import { createError, type Result } from "@clover.js/protocol";
import {
  buildPackageGoal,
  lintWorkspaceGoal,
  releaseCheckGoal,
  testPackageGoal,
  type AutomationGoal
} from "@clover.js/automation";

export const RepoCommandErrorCode = {
  InvalidArgs: 7301
} as const;

export type RepoCommandErrorPayload = {
  reason: string;
  usage: string;
  detail: string;
};

const USAGE = "clover <build|test|lint|release-check> [package]";

function invalidArgs(detail: string): Result<never, 7301, RepoCommandErrorPayload> {
  return createError(RepoCommandErrorCode.InvalidArgs, {
    reason: "invalid-args",
    usage: USAGE,
    detail
  });
}

export function parseRepoCommandGoal(
  args: readonly string[]
): Result<AutomationGoal, 7301, RepoCommandErrorPayload> {
  if (args.length === 0) {
    return invalidArgs("missing-command");
  }

  const command = args[0];
  if (command === "build") {
    const packageName = args[1];
    return typeof packageName === "string"
      ? buildPackageGoal(packageName)
      : invalidArgs("missing-package");
  }

  if (command === "test") {
    const packageName = args[1];
    return typeof packageName === "string"
      ? testPackageGoal(packageName)
      : invalidArgs("missing-package");
  }

  if (command === "lint") {
    return lintWorkspaceGoal();
  }

  if (command === "release-check") {
    return releaseCheckGoal();
  }

  return invalidArgs("unknown-command");
}
