import {
  None,
  createError,
  isError,
  type CloverError,
  type Option,
  type Result
} from "@clover.js/protocol";
import type { z } from "zod";

export const ZodErrorCode = {
  ParseFailed: 2001,
  OptionalParseFailed: 2002,
  NullableParseFailed: 2003,
  OptionalNullableParseFailed: 2004
} as const;

type ZodErrorCodeValue = (typeof ZodErrorCode)[keyof typeof ZodErrorCode];

export type ZodBoundaryMode = "parse" | "optional" | "nullable" | "optional-nullable";

export type ZodBoundaryErrorPayload = {
  mode: ZodBoundaryMode;
  inputKind: string;
  issueCount: number;
  firstPath: string;
  firstMessage: string;
};

export type ZodBoundaryError = CloverError<ZodErrorCodeValue, ZodBoundaryErrorPayload>;

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

function getFirstPath(issues: readonly ZodIssueLike[]): string {
  const issue = issues[0];
  if (!issue || issue.path.length === 0) {
    return "";
  }

  return issue.path.map(String).join(".");
}

function getFirstMessage(issues: readonly ZodIssueLike[]): string {
  const issue = issues[0];
  return issue ? issue.message : "";
}

function toBoundaryError<ErrorCode extends ZodErrorCodeValue>(
  code: ErrorCode,
  mode: ZodBoundaryMode,
  input: unknown,
  issues: readonly ZodIssueLike[]
): CloverError<ErrorCode, ZodBoundaryErrorPayload> {
  return createError(code, {
    mode,
    inputKind: getInputKind(input),
    issueCount: issues.length,
    firstPath: getFirstPath(issues),
    firstMessage: getFirstMessage(issues)
  });
}

export function fromSafeParse<T, ErrorCode extends ZodErrorCodeValue>(
  result: SafeParseResult<T>,
  code: ErrorCode,
  mode: ZodBoundaryMode,
  input: unknown
): Result<T, ErrorCode, ZodBoundaryErrorPayload> {
  if (result.success) {
    return result.data;
  }

  return toBoundaryError(code, mode, input, result.error.issues);
}

export function parseWith<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown
): Result<z.output<Schema>, typeof ZodErrorCode.ParseFailed, ZodBoundaryErrorPayload> {
  return fromSafeParse(schema.safeParse(input), ZodErrorCode.ParseFailed, "parse", input);
}

export function parseOptionalWith<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown
): Result<
  Option<z.output<Schema>>,
  typeof ZodErrorCode.OptionalParseFailed,
  ZodBoundaryErrorPayload
> {
  if (input === undefined) {
    return None;
  }

  return fromSafeParse(schema.safeParse(input), ZodErrorCode.OptionalParseFailed, "optional", input);
}

export function parseNullableWith<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown
): Result<
  Option<z.output<Schema>>,
  typeof ZodErrorCode.NullableParseFailed,
  ZodBoundaryErrorPayload
> {
  if (input === null) {
    return None;
  }

  return fromSafeParse(schema.safeParse(input), ZodErrorCode.NullableParseFailed, "nullable", input);
}

export function parseOptionalNullableWith<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown
): Result<
  Option<z.output<Schema>>,
  typeof ZodErrorCode.OptionalNullableParseFailed,
  ZodBoundaryErrorPayload
> {
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
  result: Result<Option<T>, ZodErrorCodeValue, ZodBoundaryErrorPayload>
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
