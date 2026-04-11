import { createError, isError, type Result } from "./_clover/protocol.js";
import { z } from "zod";

import { renderCommandHelp } from "./help.js";
import { type AnyCliCommand, type CommandValue, type CliOption } from "./types.js";

export const CliArgParserErrorCode = {
  InvalidCliInput: 9201
} as const;

export type CliArgParserErrorCodeValue =
  (typeof CliArgParserErrorCode)[keyof typeof CliArgParserErrorCode];

type ValidationIssue = {
  readonly path: readonly PropertyKey[];
  readonly message: string;
};

export type CliArgParserErrorPayload = {
  readonly reason: string;
  readonly message: string;
  readonly usage: string;
};

export type ParsedCommandOutput<Command extends AnyCliCommand> =
  | {
      readonly mode: "help";
      readonly text: string;
    }
  | {
      readonly mode: "parsed";
      readonly value: CommandValue<Command>;
    };

export function parseCommandArgv<Command extends AnyCliCommand>(
  command: Command,
  args: readonly string[]
): Result<ParsedCommandOutput<Command>, CliArgParserErrorCodeValue, CliArgParserErrorPayload> {
  if (args.includes("--help") || args.includes("-h")) {
    return {
      mode: "help",
      text: renderCommandHelp(command)
    };
  }

  const scanned = scanArgv(command, args);
  if (isError(scanned)) {
    return scanned as Result<ParsedCommandOutput<Command>, CliArgParserErrorCodeValue, CliArgParserErrorPayload>;
  }

  const parsed = command.schema.safeParse(scanned);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const message =
      issue === undefined
        ? "CLI arguments did not match the schema."
        : formatValidationIssue(command, scanned, issue);
    return invalidCliInput(command, "schema-parse-failed", message);
  }

  return {
    mode: "parsed",
    value: parsed.data as CommandValue<Command>
  };
}

function scanArgv(
  command: AnyCliCommand,
  args: readonly string[]
): Result<Record<string, unknown>, CliArgParserErrorCodeValue, CliArgParserErrorPayload> {
  const raw: Record<string, unknown> = {};
  const positionals: string[] = [];
  const longOptions = new Map(command.options.map((cliOption) => [cliOption.long, cliOption]));
  const shortOptions = new Map(
    command.options
      .filter((cliOption) => cliOption.short !== null)
      .map((cliOption) => [cliOption.short as string, cliOption])
  );

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];

    if (token === undefined) {
      continue;
    }

    if (token === "--") {
      return invalidCliInput(
        command,
        "unsupported-delimiter",
        "The standalone '--' delimiter is not supported in this example."
      );
    }

    if (token.startsWith("--")) {
      const parsedLong = splitLongToken(token);
      const cliOption = longOptions.get(parsedLong.name);

      if (cliOption === undefined) {
        return invalidCliInput(command, "unknown-option", `Unknown option: --${parsedLong.name}.`);
      }

      if (Object.hasOwn(raw, cliOption.key)) {
        return invalidCliInput(
          command,
          "duplicate-option",
          `Option --${cliOption.long} can only be provided once.`
        );
      }

      if (!optionTakesValue(cliOption)) {
        if (parsedLong.inlineValue !== null) {
          return invalidCliInput(
            command,
            "unexpected-option-value",
            `Boolean flag --${cliOption.long} does not accept a value.`
          );
        }

        raw[cliOption.key] = true;
        continue;
      }

      if (parsedLong.inlineValue !== null) {
        raw[cliOption.key] = parsedLong.inlineValue;
        continue;
      }

      const nextValue = args[index + 1];
      if (nextValue === undefined) {
        return invalidCliInput(
          command,
          "missing-option-value",
          `Option --${cliOption.long} requires a value.`
        );
      }

      raw[cliOption.key] = nextValue;
      index += 1;
      continue;
    }

    if (token.startsWith("-") && token !== "-") {
      if (token.length !== 2) {
        return invalidCliInput(
          command,
          "unsupported-short-syntax",
          `Combined short flags are not supported: ${token}.`
        );
      }

      const shortName = token.substring(1);
      const cliOption = shortOptions.get(shortName);

      if (cliOption === undefined) {
        return invalidCliInput(command, "unknown-option", `Unknown option: -${shortName}.`);
      }

      if (Object.hasOwn(raw, cliOption.key)) {
        return invalidCliInput(
          command,
          "duplicate-option",
          `Option --${cliOption.long} can only be provided once.`
        );
      }

      if (!optionTakesValue(cliOption)) {
        raw[cliOption.key] = true;
        continue;
      }

      const nextValue = args[index + 1];
      if (nextValue === undefined) {
        return invalidCliInput(
          command,
          "missing-option-value",
          `Option --${cliOption.long} requires a value.`
        );
      }

      raw[cliOption.key] = nextValue;
      index += 1;
      continue;
    }

    positionals.push(token);
  }

  if (positionals.length > command.arguments.length) {
    return invalidCliInput(
      command,
      "unexpected-argument",
      `Unexpected positional argument: ${JSON.stringify(positionals[command.arguments.length])}.`
    );
  }

  for (let index = 0; index < command.arguments.length; index += 1) {
    const cliArgument = command.arguments[index];
    if (cliArgument === undefined) {
      continue;
    }

    raw[cliArgument.name] = positionals[index];
  }

  return raw;
}

function splitLongToken(token: string): { readonly name: string; readonly inlineValue: string | null } {
  const equalsIndex = token.indexOf("=");
  if (equalsIndex === -1) {
    return {
      name: token.substring(2),
      inlineValue: null
    };
  }

  return {
    name: token.substring(2, equalsIndex),
    inlineValue: token.substring(equalsIndex + 1)
  };
}

function formatValidationIssue(
  command: AnyCliCommand,
  scanned: Record<string, unknown>,
  issue: ValidationIssue
): string {
  const fieldName = typeof issue.path[0] === "string" ? issue.path[0] : null;

  if (fieldName !== null) {
    const hasField = Object.hasOwn(scanned, fieldName);
    const rawValue = scanned[fieldName];
    const cliArgument = command.arguments.find((candidate) => candidate.name === fieldName);
    if (cliArgument !== undefined && rawValue === undefined) {
      return `Missing required argument <${cliArgument.name}>.`;
    }
    if (cliArgument !== undefined) {
      return `Invalid value for <${cliArgument.name}>: ${issue.message}.`;
    }

    const cliOption = command.options.find((candidate) => candidate.key === fieldName);
    if (cliOption !== undefined && !hasField) {
      return `Missing required option --${cliOption.long}.`;
    }
    if (cliOption !== undefined) {
      return `Invalid value for --${cliOption.long}: ${issue.message}.`;
    }
  }

  return `CLI arguments did not match the schema: ${issue.message}.`;
}

function invalidCliInput(
  command: AnyCliCommand,
  reason: string,
  message: string
): Result<never, CliArgParserErrorCodeValue, CliArgParserErrorPayload> {
  const helpText = renderCommandHelp(command);

  return createError(CliArgParserErrorCode.InvalidCliInput, {
    reason,
    message: `${message}\n\n${helpText}`,
    usage: helpText
  });
}

function optionTakesValue(cliOption: CliOption): boolean {
  const jsonSchema = z.toJSONSchema(cliOption.schema) as Record<string, unknown>;
  return jsonSchema["type"] !== "boolean";
}
