import { z } from "zod";

import { type AnyCliCommand, type CliArgument, type CliOption } from "./types.js";

type SchemaFacts = {
  readonly description: string | null;
  readonly enumValues: readonly string[];
  readonly defaultValue: string | number | boolean | null | undefined;
  readonly minimum: number | null;
  readonly maximum: number | null;
  readonly takesValue: boolean;
};

type HelpRow = {
  readonly label: string;
  readonly description: string;
};

export function renderCommandHelp(command: AnyCliCommand): string {
  const lines: string[] = [command.summary];

  if (command.description !== null) {
    lines.push("", command.description);
  }

  lines.push("", "Usage:", `  ${renderUsage(command)}`);

  if (command.arguments.length > 0) {
    lines.push("", "Arguments:");
    lines.push(...renderRows(command.arguments.map(renderArgumentRow)));
  }

  lines.push("", "Options:");
  lines.push(
    ...renderRows([
      ...command.options.map(renderOptionRow),
      {
        label: "-h, --help",
        description: "Print help for this command."
      }
    ])
  );

  return lines.join("\n");
}

function renderUsage(command: AnyCliCommand): string {
  const parts = [command.name];

  for (const cliArgument of command.arguments) {
    parts.push(isRequiredSchema(cliArgument.schema) ? `<${cliArgument.name}>` : `[${cliArgument.name}]`);
  }

  if (command.options.length > 0) {
    parts.push("[options]");
  }

  return parts.join(" ");
}

function renderArgumentRow(cliArgument: CliArgument): HelpRow {
  const facts = readSchemaFacts(cliArgument.schema);
  return {
    label: `<${cliArgument.name}>`,
    description: buildHelpDescription(facts)
  };
}

function renderOptionRow(cliOption: CliOption): HelpRow {
  const facts = readSchemaFacts(cliOption.schema);
  const labelParts = [];

  if (cliOption.short !== null) {
    labelParts.push(`-${cliOption.short}`);
  }

  labelParts.push(`--${cliOption.long}${facts.takesValue ? ` <${cliOption.valueName ?? cliOption.key}>` : ""}`);

  return {
    label: labelParts.join(", "),
    description: buildHelpDescription(facts)
  };
}

function renderRows(rows: readonly HelpRow[]): readonly string[] {
  const labelWidth = rows.reduce((width, row) => Math.max(width, row.label.length), 0);

  return rows.map((row) => `  ${row.label.padEnd(labelWidth)}  ${row.description}`);
}

function buildHelpDescription(facts: SchemaFacts): string {
  const parts: string[] = [];

  if (facts.description !== null) {
    parts.push(facts.description);
  }

  if (facts.enumValues.length > 0) {
    parts.push(`Choices: ${facts.enumValues.join(" | ")}.`);
  }

  if (facts.minimum !== null || facts.maximum !== null) {
    const lower = facts.minimum === null ? "-inf" : String(facts.minimum);
    const upper = facts.maximum === null ? "+inf" : String(facts.maximum);
    parts.push(`Range: ${lower} to ${upper}.`);
  }

  if (facts.defaultValue !== undefined) {
    parts.push(`Default: ${formatDefaultValue(facts.defaultValue)}.`);
  }

  return parts.join(" ");
}

function formatDefaultValue(value: string | number | boolean | null): string {
  return typeof value === "string" ? JSON.stringify(value) : String(value);
}

function readSchemaFacts(schema: z.ZodTypeAny): SchemaFacts {
  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
  const enumValues = Array.isArray(jsonSchema["enum"])
    ? jsonSchema["enum"].filter((value): value is string => typeof value === "string")
    : [];
  const defaultValue = readDefaultValue(jsonSchema["default"]);
  const minimum = typeof jsonSchema["minimum"] === "number" ? jsonSchema["minimum"] : null;
  const maximum = typeof jsonSchema["maximum"] === "number" ? jsonSchema["maximum"] : null;
  const typeValue = jsonSchema["type"];

  return {
    description:
      typeof jsonSchema["description"] === "string" ? jsonSchema["description"] : schema.description ?? null,
    enumValues,
    defaultValue,
    minimum,
    maximum,
    takesValue: typeValue !== "boolean"
  };
}

function readDefaultValue(value: unknown): string | number | boolean | null | undefined {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return value;
  }

  return undefined;
}

function isRequiredSchema(schema: z.ZodTypeAny): boolean {
  return !schema.safeParse(undefined).success;
}
