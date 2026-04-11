import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { createError } from "@clover/protocol";
import {
  CliErrorCode,
  emitCliRender,
  formatCliError,
  parseArgvWith,
  readArgv,
  renderCliResult,
  toExitCode
} from "@clover/cli";

const CliTestErrorCode = {
  BadInput: 4001,
  MissingPort: 4002,
  EmitBad: 4004,
  BadPort: 4010
} as const;

describe("@clover/cli", () => {
  it("reads business argv by dropping the node executable and script path", () => {
    expect(readArgv(["node", "script.js", "--port", "8080"])).toEqual(["--port", "8080"]);
  });

  it("formats scalar and object Clover errors into stable stderr text", () => {
    expect(formatCliError(createError(CliTestErrorCode.BadInput, "bad-input"))).toBe(
      "[4001] bad-input"
    );
    expect(
      formatCliError(
        createError(CliTestErrorCode.MissingPort, {
          reason: "missing-port",
          usage: "tool --port 8080"
        })
      )
    ).toBe("[4002] missing-port");
  });

  it("maps exit codes with a safe default", () => {
    expect(toExitCode(createError(CliTestErrorCode.BadInput, "bad-input"))).toBe(1);
    expect(toExitCode(createError(CliTestErrorCode.BadInput, "bad-input"), { 4001: 64 })).toBe(64);
    expect(toExitCode(createError(CliTestErrorCode.BadInput, "bad-input"), { 4001: 999 })).toBe(1);
  });

  it("renders successful results without inventing a second business protocol", () => {
    const rendered = renderCliResult({
      argv: ["node", "script.js", "8080"],
      execute(args) {
        return Number(args[0]);
      },
      onSuccess(value) {
        return `port=${value}`;
      }
    });

    expect(rendered).toEqual({
      exitCode: 0,
      stdout: "port=8080"
    });
  });

  it("renders Clover errors into stderr and exit code", () => {
    const rendered = renderCliResult({
      argv: ["node", "script.js", "bad"],
      execute() {
        return createError(CliTestErrorCode.BadPort, {
          reason: "bad-port",
          usage: "tool 8080"
        });
      },
      onSuccess(value) {
        return String(value);
      },
      mapExitCode: {
        4010: 64
      }
    });

    expect(rendered).toEqual({
      exitCode: 64,
      stderr: "[4010] bad-port",
      error: createError(CliTestErrorCode.BadPort, {
        reason: "bad-port",
        usage: "tool 8080"
      })
    });
  });

  it("returns usage when arguments are required but missing", () => {
    const rendered = renderCliResult({
      argv: ["node", "script.js"],
      usage: "tool <port>",
      requireArgs: true,
      execute() {
        return 1;
      },
      onSuccess(value) {
        return String(value);
      }
    });

    expect(rendered).toEqual({
      exitCode: 1,
      stderr: "tool <port>",
      error: createError(CliErrorCode.MissingArgs, {
        reason: "missing-args",
        usage: "tool <port>"
      })
    });
  });

  it("emits rendered output through injectable writers", () => {
    const stdout = vi.fn();
    const stderr = vi.fn();

    expect(
      emitCliRender(
        {
          exitCode: 0,
          stdout: "ok"
        },
        {
          writeStdout: stdout,
          writeStderr: stderr
        }
      )
    ).toBe(0);
    expect(stdout).toHaveBeenCalledWith("ok");
    expect(stderr).not.toHaveBeenCalled();

    expect(
      emitCliRender(
        {
          exitCode: 2,
          stderr: "bad",
          error: createError(CliTestErrorCode.EmitBad, "bad")
        },
        {
          writeStdout: stdout,
          writeStderr: stderr
        }
      )
    ).toBe(2);
    expect(stderr).toHaveBeenCalledWith("bad");
  });

  it("bridges argv parsing through @clover/zod", () => {
    const schema = z.tuple([z.literal("--port"), z.string()]);
    expect(parseArgvWith(schema, ["node", "cli.js", "--port", "8080"])).toEqual([
      "--port",
      "8080"
    ]);
  });
});
