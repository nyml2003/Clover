import { spawn } from "node:child_process";
import process from "node:process";

import { None, createError, isError, type Result } from "@clover.js/protocol";
import type { AutomationPlanNode, AutomationTaskOutput } from "@clover.js/automation";

import type { RepoTaskCommand } from "./types.js";

export const RepoTaskCommandErrorCode = {
  UnsupportedNode: 7401,
  CommandFailed: 7402
} as const;

export type RepoTaskCommandErrorPayload = {
  reason: string;
  nodeId: string;
  detail: string;
};

function createUnsupportedNodeError(
  nodeId: string
): Result<never, 7401, RepoTaskCommandErrorPayload> {
  return createError(RepoTaskCommandErrorCode.UnsupportedNode, {
    reason: "unsupported-node",
    nodeId,
    detail: nodeId
  });
}

function createCommandFailedError(
  nodeId: string,
  detail: string
): Result<never, 7402, RepoTaskCommandErrorPayload> {
  return createError(RepoTaskCommandErrorCode.CommandFailed, {
    reason: "command-failed",
    nodeId,
    detail
  });
}

function pnpmCommand(): string {
  return process.platform === "win32" ? "pnpm.cmd" : "pnpm";
}

function spawnCommand(command: RepoTaskCommand) {
  if (process.platform === "win32") {
    const comspec = process.env["ComSpec"] ?? "cmd.exe";
    return {
      command: comspec,
      args: ["/d", "/s", "/c", command.command, ...command.args]
    };
  }

  return {
    command: command.command,
    args: [...command.args]
  };
}

export function createRepoTaskCommand(
  rootDir: string,
  node: AutomationPlanNode
): Result<RepoTaskCommand, 7401, RepoTaskCommandErrorPayload> {
  if (node.kind === "build-package" && node.packageName !== None) {
    return {
      command: pnpmCommand(),
      args: ["--filter", node.packageName, "run", "build"],
      cwd: rootDir
    };
  }

  if (node.kind === "test-package" && node.packageName !== None) {
    return {
      command: pnpmCommand(),
      args: ["--filter", node.packageName, "run", "unittest"],
      cwd: rootDir
    };
  }

  if (node.kind === "lint-workspace") {
    return {
      command: pnpmCommand(),
      args: ["run", "lint:legacy"],
      cwd: rootDir
    };
  }

  return createUnsupportedNodeError(node.id);
}

export async function runWorkspaceTaskNode(
  rootDir: string,
  node: AutomationPlanNode
): Promise<Result<AutomationTaskOutput, 7401 | 7402, RepoTaskCommandErrorPayload>> {
  const command = createRepoTaskCommand(rootDir, node);
  if (isError(command)) {
    return command;
  }

  const spawned = spawnCommand(command);

  return new Promise((resolve) => {
    const child = spawn(spawned.command, spawned.args, {
      cwd: command.cwd,
      stdio: "pipe"
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", (error) => {
      resolve(createCommandFailedError(node.id, String(error)));
    });
    child.on("close", (exitCode) => {
      if (exitCode === 0) {
        resolve({
          nodeId: node.id,
          exitCode: 0,
          stdout,
          stderr
        });
        return;
      }

      resolve(createCommandFailedError(node.id, String(exitCode ?? -1)));
    });
  });
}
