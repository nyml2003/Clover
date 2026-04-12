import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { defaultAutomationPolicy, emptyAutomationFacts } from "@clover.js/automation";
import { None, createError } from "@clover.js/protocol";
import {
  RepoCommandErrorCode,
  RepoTaskCommandErrorCode,
  createDefaultRepoCommandEnvironment,
  createRepoTaskCommand,
  createRepoCommandEnvironment,
  emitRepoCommandResult,
  parseRepoCommandGoal,
  runRepoCommand
} from "@clover.js/repo-command";

describe("@clover.js/repo-command", () => {
  it("parses build and release-check goals from repo args", () => {
    expect(parseRepoCommandGoal(["build", "@clover.js/http"])).toEqual({
      kind: "build-package",
      packageName: "@clover.js/http"
    });
    expect(parseRepoCommandGoal(["release-check"])).toEqual({
      kind: "release-check"
    });
  });

  it("returns Clover errors for invalid repo args", () => {
    expect(parseRepoCommandGoal([])).toEqual(
      createError(RepoCommandErrorCode.InvalidArgs, {
        reason: "invalid-args",
        usage: "clover <build|test|lint|release-check> [package]",
        detail: "missing-command"
      })
    );
  });

  it("maps automation nodes to current repo commands", () => {
    expect(
      createRepoTaskCommand("C:\\repo", {
        id: "build-package:@clover.js/http",
        kind: "build-package",
        packageName: "@clover.js/http"
      })
    ).toEqual({
      command: "pnpm.cmd",
      args: ["--filter", "@clover.js/http", "run", "build"],
      cwd: "C:\\repo"
    });

    expect(
      createRepoTaskCommand("C:\\repo", {
        id: "lint-workspace",
        kind: "lint-workspace",
        packageName: None
      })
    ).toEqual({
      command: "pnpm.cmd",
      args: ["run", "lint:legacy"],
      cwd: "C:\\repo"
    });

    expect(
      createRepoTaskCommand("C:\\repo", {
        id: "bad",
        kind: "build-package",
        packageName: None
      })
    ).toEqual(
      createError(RepoTaskCommandErrorCode.UnsupportedNode, {
        reason: "unsupported-node",
        nodeId: "bad",
        detail: "bad"
      })
    );
  });

  it("creates a default repo command environment for the current workspace", () => {
    expect(createDefaultRepoCommandEnvironment("C:\\repo")).toEqual({
      rootDir: "C:\\repo",
      packagesDir: "packages",
      maxParallelism: 1,
      policy: {
        includeBuildDependencies: true,
        stopOnFirstFailure: true
      },
      facts: {
        completedNodeIds: [],
        failedNodeIds: []
      }
    });
  });

  it("emits rendered repo command output through injectable writers", () => {
    let stdout = "";
    let stderr = "";

    expect(
      emitRepoCommandResult(
        {
          ok: true,
          exitCode: 0,
          stdout: "ok=true",
          stderr: ""
        },
        {
          writeStdout(text) {
            stdout = text;
          },
          writeStderr(text) {
            stderr = text;
          }
        }
      )
    ).toBe(0);
    expect(stdout).toBe("ok=true");
    expect(stderr).toBe("");
  });

  it("runs a repo build command through automation planning and execution", async () => {
    const rootDir = mkdtempSync(join(tmpdir(), "clover-repo-command-"));
    const packagesDir = join(rootDir, "packages");
    const protocolDir = join(packagesDir, "protocol");
    const httpDir = join(packagesDir, "http");

    mkdirSync(protocolDir, { recursive: true });
    mkdirSync(httpDir, { recursive: true });

    writeFileSync(
      join(protocolDir, "package.json"),
      JSON.stringify(
        {
          name: "@clover.js/protocol",
          dependencies: {},
          devDependencies: {},
          scripts: {
            build: "pnpm build",
            lint: "pnpm lint"
          }
        },
        null,
        2
      ),
      "utf-8"
    );
    writeFileSync(
      join(httpDir, "package.json"),
      JSON.stringify(
        {
          name: "@clover.js/http",
          dependencies: {
            "@clover.js/protocol": "workspace:*"
          },
          devDependencies: {},
          scripts: {
            build: "pnpm build",
            lint: "pnpm lint",
            unittest: "pnpm test"
          }
        },
        null,
        2
      ),
      "utf-8"
    );

    const environment = createRepoCommandEnvironment(
      rootDir,
      "packages",
      2,
      defaultAutomationPolicy(),
      emptyAutomationFacts()
    );

    const result = await runRepoCommand(
      ["node", "clover.js", "build", "@clover.js/http"],
      environment,
      async (node) => ({
        nodeId: node.id,
        exitCode: 0
      })
    );

    expect(result.ok).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("ok=true");
  });
});
