import {
  None,
  createError,
  isError,
  type CloverError,
  type None as NoneValue,
  type Option,
  type Result
} from "@clover/protocol";
import { z } from "zod";

export const ZodErrorCode = {
  ParseFailed: 2001,
  OptionalParseFailed: 2002,
  NullableParseFailed: 2003,
  OptionalNullableParseFailed: 2004
} as const;

export type ZodBoundaryMode = "parse" | "optional" | "nullable" | "optional-nullable";

export type ZodBoundaryErrorData = {
  mode: ZodBoundaryMode;
  inputKind: string;
  issueCount: number;
  firstPath: string | NoneValue;
  firstMessage: string | NoneValue;
};

export type ZodBoundaryError = CloverError<ZodBoundaryErrorData>;

type ZodIssueLike = {
  path: readonly PropertyKey[];
  message: string;
};

type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: { issues: readonly ZodIssueLike[] } };

function getInputKind(value: unknown): string {
  if (value === undefined) {
    return "undefined";
  }

  if (value === null) {
    return "null";
  }

  if (Array.isArray(value)) {
    return "array";
  }

  return typeof value;
}

function getFirstPath(issues: readonly ZodIssueLike[]): string | NoneValue {
  const issue = issues[0];
  if (!issue || issue.path.length === 0) {
    return None;
  }

  return issue.path.map(String).join(".");
}

function getFirstMessage(issues: readonly ZodIssueLike[]): string | NoneValue {
  const issue = issues[0];
  return issue ? issue.message : None;
}

function toBoundaryError(
  code: number,
  mode: ZodBoundaryMode,
  input: unknown,
  issues: readonly ZodIssueLike[]
): ZodBoundaryError {
  return createError(code, {
    mode,
    inputKind: getInputKind(input),
    issueCount: issues.length,
    firstPath: getFirstPath(issues),
    firstMessage: getFirstMessage(issues)
  });
}

export function fromSafeParse<T>(
  result: SafeParseResult<T>,
  code: number,
  mode: ZodBoundaryMode,
  input: unknown
): Result<T, ZodBoundaryErrorData> {
  if (result.success) {
    return result.data;
  }

  return toBoundaryError(code, mode, input, result.error.issues);
}

export function parseWith<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown
): Result<z.output<Schema>, ZodBoundaryErrorData> {
  return fromSafeParse(schema.safeParse(input), ZodErrorCode.ParseFailed, "parse", input);
}

export function parseOptionalWith<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown
): Result<Option<z.output<Schema>>, ZodBoundaryErrorData> {
  if (input === undefined) {
    return None;
  }

  return fromSafeParse(schema.safeParse(input), ZodErrorCode.OptionalParseFailed, "optional", input);
}

export function parseNullableWith<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown
): Result<Option<z.output<Schema>>, ZodBoundaryErrorData> {
  if (input === null) {
    return None;
  }

  return fromSafeParse(schema.safeParse(input), ZodErrorCode.NullableParseFailed, "nullable", input);
}

export function parseOptionalNullableWith<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown
): Result<Option<z.output<Schema>>, ZodBoundaryErrorData> {
  if (input === undefined || input === null) {
    return None;
  }

  return fromSafeParse(
    schema.safeParse(input),
    ZodErrorCode.OptionalNullableParseFailed,
    "optional-nullable",
    input
  );
}

export function unwrapParsedOption<T>(
  result: Result<Option<T>, ZodBoundaryErrorData>
): { ok: true; value: Option<T> } | { ok: false; error: ZodBoundaryError } {
  if (isError(result)) {
    return {
      ok: false,
      error: result
    };
  }

  return {
    ok: true,
    value: result
  };
}
