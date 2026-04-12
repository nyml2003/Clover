import process from "node:process";

import { defaultAutomationPolicy, emptyAutomationFacts } from "@clover.js/automation";

import { createRepoCommandEnvironment } from "./types.js";
import type {
  RepoCommandEnvironment,
  RepoCommandIO,
  RepoCommandRenderResult
} from "./types.js";

const defaultRepoCommandIO: RepoCommandIO = {
  writeStdout(text) {
    process.stdout.write(text.endsWith("\n") ? text : `${text}\n`);
  },
  writeStderr(text) {
    process.stderr.write(text.endsWith("\n") ? text : `${text}\n`);
  }
};

export function createDefaultRepoCommandEnvironment(rootDir: string): RepoCommandEnvironment {
  return createRepoCommandEnvironment(
    rootDir,
    "packages",
    1,
    defaultAutomationPolicy(),
    emptyAutomationFacts()
  );
}

export function emitRepoCommandResult(
  rendered: RepoCommandRenderResult,
  io: RepoCommandIO = defaultRepoCommandIO
): number {
  if (rendered.ok) {
    if (rendered.stdout.length > 0) {
      io.writeStdout(rendered.stdout);
    }

    return rendered.exitCode;
  }

  if (rendered.stderr.length > 0) {
    io.writeStderr(rendered.stderr);
  }

  return rendered.exitCode;
}
