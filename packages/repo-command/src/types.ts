import type { AutomationFacts, AutomationPolicy, AutomationTaskRunner } from "@clover.js/automation";

export type RepoCommandEnvironment = {
  rootDir: string;
  packagesDir: string;
  maxParallelism: number;
  policy: AutomationPolicy;
  facts: AutomationFacts;
};

export type RepoCommandRenderResult = {
  ok: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
};

export type RepoCommandRunner = AutomationTaskRunner;

export type RepoTaskCommand = {
  command: string;
  args: readonly string[];
  cwd: string;
};

export type RepoCommandIO = {
  writeStdout: (text: string) => void;
  writeStderr: (text: string) => void;
};

export function createRepoCommandEnvironment(
  rootDir: string,
  packagesDir: string,
  maxParallelism: number,
  policy: AutomationPolicy,
  facts: AutomationFacts
): RepoCommandEnvironment {
  return {
    rootDir,
    packagesDir,
    maxParallelism,
    policy,
    facts
  };
}
