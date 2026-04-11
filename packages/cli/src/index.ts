import process from "node:process";

import {
  createError,
  isError,
  isErrorObjectPayload,
  type CloverError,
  type ErrorPayload,
  type Result
} from "@clover/protocol";
import { inRange } from "@clover/std";
import { parseWith, type ZodBoundaryErrorPayload } from "@clover/zod";
import { type z } from "zod";

export const CliErrorCode = {
  MissingArgs: 3001
} as const;

type CliErrorCodeValue = (typeof CliErrorCode)[keyof typeof CliErrorCode];

export type CliErrorPayload = {
  reason: string;
  usage: string;
};

export type CliRenderSuccess = {
  exitCode: number;
  stdout: string;
};

export type CliRenderFailure<
  ErrorCode extends number = number,
  Payload extends ErrorPayload = ErrorPayload
> = {
  exitCode: number;
  stderr: string;
  error: CloverError<ErrorCode, Payload>;
};

export type CliRenderResult<
  ErrorCode extends number = number,
  Payload extends ErrorPayload = ErrorPayload
> =
  | CliRenderSuccess
  | CliRenderFailure<ErrorCode, Payload>;

export type ExitCodeMapping = Partial<Record<number, number>>;

export type RenderCliResultOptions<
  T,
  ErrorCode extends number = number,
  Payload extends ErrorPayload = ErrorPayload
> = {
  argv?: readonly string[];
  usage?: string;
  requireArgs?: boolean;
  execute: (args: readonly string[]) => Result<T, ErrorCode, Payload>;
  onSuccess: (value: T) => string;
  mapExitCode?: ExitCodeMapping;
  fallbackErrorMessage?: string;
};

export type CliIO = {
  writeStdout: (text: string) => void;
  writeStderr: (text: string) => void;
};

const defaultCliIO: CliIO = {
  writeStdout(text) {
    process.stdout.write(text.endsWith("\n") ? text : `${text}\n`);
  },
  writeStderr(text) {
    process.stderr.write(text.endsWith("\n") ? text : `${text}\n`);
  }
};

function toText(value: string | number | boolean): string {
  return String(value);
}

function formatErrorObjectPayload(value: Record<string, string | number | boolean>): string {
  const preferredKeys = ["message", "reason", "firstMessage", "inputKind", "firstPath", "usage"];

  for (const key of preferredKeys) {
    const candidate = value[key];
    if (
      typeof candidate === "string" ||
      typeof candidate === "number" ||
      typeof candidate === "boolean"
    ) {
      return toText(candidate);
    }
  }

  return JSON.stringify(value);
}

export function readArgv(argv: readonly string[] = process.argv): readonly string[] {
  return argv.slice(2);
}

export function formatCliError(
  error: CloverError,
  fallbackMessage: string = "CLI execution failed."
): string {
  const prefix = `[${error.__code__}]`;

  if (
    typeof error.payload === "string" ||
    typeof error.payload === "number" ||
    typeof error.payload === "boolean"
  ) {
    return `${prefix} ${toText(error.payload)}`;
  }

  if (isErrorObjectPayload(error.payload)) {
    return `${prefix} ${formatErrorObjectPayload(error.payload)}`;
  }

  return `${prefix} ${fallbackMessage}`;
}

export function toExitCode(error: CloverError, mapping: ExitCodeMapping = {}): number {
  const mapped = mapping[error.__code__];

  if (
    typeof mapped === "number" &&
    Number.isInteger(mapped) &&
    inRange(mapped, 0, 255)
  ) {
    return mapped;
  }

  return 1;
}

export function renderCliResult<
  T,
  ErrorCode extends number = number,
  Payload extends ErrorPayload = ErrorPayload
>(
  options: RenderCliResultOptions<T, ErrorCode, Payload>
): CliRenderResult<ErrorCode | CliErrorCodeValue, Payload | CliErrorPayload> {
  const args = readArgv(options.argv);

  if (options.requireArgs === true && args.length === 0) {
    const error = createError(CliErrorCode.MissingArgs, {
      reason: "missing-args",
      usage: options.usage ?? ""
    });

    return {
      exitCode: 1,
      stderr: options.usage ?? formatCliError(error, "Missing CLI arguments."),
      error
    };
  }

  const result = options.execute(args);

  if (isError(result)) {
    return {
      exitCode: toExitCode(result, options.mapExitCode),
      stderr: formatCliError(result, options.fallbackErrorMessage),
      error: result
    };
  }

  return {
    exitCode: 0,
    stdout: options.onSuccess(result)
  };
}

export function emitCliRender<ErrorCode extends number = number, Payload extends ErrorPayload = ErrorPayload>(
  rendered: CliRenderResult<ErrorCode, Payload>,
  io: CliIO = defaultCliIO
): number {
  if ("stdout" in rendered) {
    io.writeStdout(rendered.stdout);
    return rendered.exitCode;
  }

  io.writeStderr(rendered.stderr);
  return rendered.exitCode;
}

export function parseArgvWith<Schema extends z.ZodType>(
  schema: Schema,
  argv?: readonly string[]
): Result<z.output<Schema>, number, ZodBoundaryErrorPayload> {
  return parseWith(schema, readArgv(argv));
}
