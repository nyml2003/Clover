import { z } from "zod";

import {
  type CliArgument,
  type CliCommand,
  type CliOption,
  type CliShapeFromSpecs
} from "./types.js";

export function argument<const Name extends string, Schema extends z.ZodTypeAny>(config: {
  name: Name;
  schema: Schema;
}): CliArgument<Name, Schema> {
  return {
    kind: "argument",
    name: config.name,
    schema: config.schema
  };
}

export function option<const Key extends string, Schema extends z.ZodTypeAny>(config: {
  key: Key;
  long: string;
  short?: string;
  valueName?: string;
  schema: Schema;
}): CliOption<Key, Schema> {
  return {
    kind: "option",
    key: config.key,
    long: config.long,
    short: config.short ?? null,
    valueName: config.valueName ?? null,
    schema: config.schema
  };
}

export function command<
  const Name extends string,
  const Arguments extends readonly CliArgument<string, z.ZodTypeAny>[],
  const Options extends readonly CliOption<string, z.ZodTypeAny>[]
>(config: {
  name: Name;
  summary: string;
  description?: string;
  arguments: Arguments;
  options: Options;
}): CliCommand<Name, Arguments, Options> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const cliArgument of config.arguments) {
    shape[cliArgument.name] = cliArgument.schema;
  }

  for (const cliOption of config.options) {
    shape[cliOption.key] = cliOption.schema;
  }

  return {
    name: config.name,
    summary: config.summary,
    description: config.description ?? null,
    arguments: config.arguments,
    options: config.options,
    schema: z.object(shape) as z.ZodObject<CliShapeFromSpecs<Arguments, Options>>
  };
}
