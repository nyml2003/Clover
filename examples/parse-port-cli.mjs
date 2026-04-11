import { createError, isError } from "../packages/protocol/dist/index.js";
import { emitCliRender, parseArgvWith, renderCliResult } from "../packages/cli/dist/index.js";
import { NumberErrorCode, inRange, parseSmiInt } from "../packages/std/dist/index.js";
import { z } from "zod";

const PortArgvSchema = z.tuple([z.string()]);

const CliErrorCode = {
  InvalidPortRange: 9101
};

function executePortCli(args) {
  const parsedArgs = parseArgvWith(PortArgvSchema, ["node", "parse-port-cli.mjs", ...args]);
  if (isError(parsedArgs)) {
    return parsedArgs;
  }

  const [rawPort] = parsedArgs;
  const parsedPort = parseSmiInt(rawPort);

  if (isError(parsedPort)) {
    return parsedPort;
  }

  if (!inRange(parsedPort, 1, 65_535)) {
    return createError(CliErrorCode.InvalidPortRange, {
      reason: "port-out-of-range",
      input: rawPort
    });
  }

  return {
    raw: rawPort,
    port: parsedPort
  };
}

const rendered = renderCliResult({
  argv: process.argv,
  usage: "Usage: pnpm run example:parse-port-cli -- <port>",
  requireArgs: true,
  execute: executePortCli,
  onSuccess(value) {
    return JSON.stringify(value, null, 2);
  },
  mapExitCode: {
    [NumberErrorCode.InvalidSmiInt]: 64,
    [CliErrorCode.InvalidPortRange]: 65
  },
  fallbackErrorMessage: "Port parsing failed."
});

process.exitCode = emitCliRender(rendered);
