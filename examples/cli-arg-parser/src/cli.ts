import process from "node:process";

import { emitCliRender, renderCliResult } from "./_clover/cli.js";

import { executeCreateAppCommand } from "./example-command.js";
import { CliArgParserErrorCode } from "./parser.js";

const rendered = renderCliResult({
  argv: process.argv,
  execute(args) {
    return executeCreateAppCommand(args);
  },
  onSuccess(output) {
    return output.mode === "help" ? output.text : JSON.stringify(output.value, null, 2);
  },
  mapExitCode: {
    [CliArgParserErrorCode.InvalidCliInput]: 64
  }
});

process.exitCode = emitCliRender(rendered);
