import process from "node:process";

import { runWorkspaceTaskNode } from "./command.js";
import { runRepoCommand } from "./run.js";
import {
  createDefaultRepoCommandEnvironment,
  emitRepoCommandResult
} from "./runtime.js";

async function main(): Promise<number> {
  const environment = createDefaultRepoCommandEnvironment(process.cwd());
  const rendered = await runRepoCommand(process.argv, environment, async (node) =>
    runWorkspaceTaskNode(environment.rootDir, node)
  );

  return emitRepoCommandResult(rendered);
}

void main().then((exitCode) => {
  process.exitCode = exitCode;
});
