import { type z } from "zod";

export type CliArgument<
  Name extends string = string,
  Schema extends z.ZodTypeAny = z.ZodTypeAny
> = {
  readonly kind: "argument";
  readonly name: Name;
  readonly schema: Schema;
};

export type CliOption<
  Key extends string = string,
  Schema extends z.ZodTypeAny = z.ZodTypeAny
> = {
  readonly kind: "option";
  readonly key: Key;
  readonly long: string;
  readonly short: string | null;
  readonly valueName: string | null;
  readonly schema: Schema;
};

export type CliShapeFromSpecs<
  Arguments extends readonly CliArgument[],
  Options extends readonly CliOption[]
> = {
  [Argument in Arguments[number] as Argument["name"]]: Argument["schema"];
} & {
  [Option in Options[number] as Option["key"]]: Option["schema"];
};

export type CliCommand<
  Name extends string = string,
  Arguments extends readonly CliArgument[] = readonly CliArgument[],
  Options extends readonly CliOption[] = readonly CliOption[]
> = {
  readonly name: Name;
  readonly summary: string;
  readonly description: string | null;
  readonly arguments: Arguments;
  readonly options: Options;
  readonly schema: z.ZodObject<CliShapeFromSpecs<Arguments, Options>>;
};

export type AnyCliCommand = CliCommand<string, readonly CliArgument[], readonly CliOption[]>;

export type CommandValue<Command extends AnyCliCommand> = z.output<Command["schema"]>;
