import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { isError } from "../src/_clover/protocol.js";
import { describe, expect, it } from "vitest";

import { CreateAppCommand, executeCreateAppCommand, renderCommandHelp } from "../src/index.ts";

const cliPath = fileURLToPath(new URL("../dist/cli.js", import.meta.url));

describe("@clover/example-cli-arg-parser", () => {
  it("parses scaffold-style argv and preserves typed output", () => {
    expect(
      executeCreateAppCommand([
        "demo-app",
        "--template=cli",
        "--package-manager",
        "npm",
        "--output",
        "./apps",
        "--retries",
        "4",
        "--force"
      ])
    ).toEqual({
      mode: "parsed",
      value: {
        name: "demo-app",
        template: "cli",
        packageManager: "npm",
        output: "./apps",
        retries: 4,
        force: true
      }
    });
  });

  it("fills defaults from the schema when options are omitted", () => {
    expect(executeCreateAppCommand(["demo-app"])).toEqual({
      mode: "parsed",
      value: {
        name: "demo-app",
        template: "react",
        packageManager: "pnpm",
        output: ".",
        retries: 2,
        force: false
      }
    });
  });

  it("renders help from the same DSL metadata", () => {
    const help = renderCommandHelp(CreateAppCommand);

    expect(help).toContain("Usage:");
    expect(help).toContain("create-clover-app <name> [options]");
    expect(help).toContain("Project name in kebab-case.");
    expect(help).toContain("Choices: react | lib | cli.");
    expect(help).toContain('Default: "react".');
    expect(help).toContain("Range: 0 to 5.");
    expect(help).toContain("-h, --help");
  });

  it("returns help mode without treating it as an error", () => {
    const result = executeCreateAppCommand(["--help"]);

    expect(isError(result)).toBe(false);
    if (isError(result)) {
      return;
    }

    expect(result.mode).toBe("help");
    expect(result.text).toContain("Options:");
  });

  it("prints normalized JSON from the CLI", () => {
    const result = spawnSync(
      process.execPath,
      [cliPath, "demo-app", "--template", "lib", "--retries", "3"],
      {
        encoding: "utf8"
      }
    );

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toEqual({
      name: "demo-app",
      template: "lib",
      packageManager: "pnpm",
      output: ".",
      retries: 3,
      force: false
    });
  });

  it("prints error and help when the required argument is missing", () => {
    const result = spawnSync(process.execPath, [cliPath], {
      encoding: "utf8"
    });

    expect(result.status).toBe(64);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("Missing required argument <name>.");
    expect(result.stderr).toContain("Usage:");
  });

  it("prints error and help for unknown options", () => {
    const result = spawnSync(process.execPath, [cliPath, "demo-app", "--bogus"], {
      encoding: "utf8"
    });

    expect(result.status).toBe(64);
    expect(result.stderr).toContain("Unknown option: --bogus.");
    expect(result.stderr).toContain("--template <template>");
  });

  it("prints error and help for invalid enum values", () => {
    const result = spawnSync(process.execPath, [cliPath, "demo-app", "--template", "web"], {
      encoding: "utf8"
    });

    expect(result.status).toBe(64);
    expect(result.stderr).toContain("Invalid value for --template:");
    expect(result.stderr).toContain("Choices: react | lib | cli.");
  });

  it("prints error and help for missing option values", () => {
    const result = spawnSync(process.execPath, [cliPath, "demo-app", "--output"], {
      encoding: "utf8"
    });

    expect(result.status).toBe(64);
    expect(result.stderr).toContain("Option --output requires a value.");
    expect(result.stderr).toContain("Destination directory for the generated project.");
  });
});
