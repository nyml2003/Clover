import {
  createError,
  type CloverError,
  type FiniteFloat64,
  type Result
} from "@clover.js/protocol";

import { isObjectRecord } from "../guard/index.js";

export const ConvertErrorCode = {
  InvalidString: 1901,
  InvalidNonEmptyString: 1902,
  InvalidFiniteNumber: 1903,
  InvalidSafeInteger: 1904,
  InvalidBoolean: 1905,
  InvalidRecord: 1906
} as const;

type ConvertErrorCodeValue = (typeof ConvertErrorCode)[keyof typeof ConvertErrorCode];

export type ConvertErrorPayload = {
  expected: string;
  received: string;
  reason: string;
};

export type ConvertError = CloverError<ConvertErrorCodeValue, ConvertErrorPayload>;

function getInputKind(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "undefined";
  }

  if (Array.isArray(value)) {
    return "array";
  }

  return typeof value;
}

function createConvertError<ErrorCode extends ConvertErrorCodeValue>(
  code: ErrorCode,
  value: unknown,
  expected: string,
  reason: string
): CloverError<ErrorCode, ConvertErrorPayload> {
  return createError(code, {
    expected,
    received: getInputKind(value),
    reason
  });
}

export function toStringValue(
  value: unknown
): Result<string, typeof ConvertErrorCode.InvalidString, ConvertErrorPayload> {
  if (typeof value !== "string") {
    return createConvertError(ConvertErrorCode.InvalidString, value, "string", "not-string");
  }

  return value;
}

export function toNonEmptyStringValue(
  value: unknown
): Result<string, typeof ConvertErrorCode.InvalidNonEmptyString, ConvertErrorPayload> {
  const result = toStringValue(value);
  if (typeof result !== "string") {
    return createConvertError(
      ConvertErrorCode.InvalidNonEmptyString,
      value,
      "non-empty-string",
      "not-string"
    );
  }

  if (result.length === 0) {
    return createConvertError(
      ConvertErrorCode.InvalidNonEmptyString,
      value,
      "non-empty-string",
      "empty-string"
    );
  }

  return result;
}

export function toFiniteNumberValue(
  value: unknown
): Result<FiniteFloat64, typeof ConvertErrorCode.InvalidFiniteNumber, ConvertErrorPayload> {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value as FiniteFloat64;
  }

  if (typeof value === "string" && value.length > 0 && value.trim() === value) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed as FiniteFloat64;
    }
  }

  return createConvertError(
    ConvertErrorCode.InvalidFiniteNumber,
    value,
    "finite-number",
    "not-finite-number"
  );
}

export function toSafeIntegerValue(
  value: unknown
): Result<number, typeof ConvertErrorCode.InvalidSafeInteger, ConvertErrorPayload> {
  const parsed = toFiniteNumberValue(value);
  if (typeof parsed !== "number") {
    return createConvertError(
      ConvertErrorCode.InvalidSafeInteger,
      value,
      "safe-integer",
      "not-finite-number"
    );
  }

  if (!Number.isSafeInteger(parsed)) {
    return createConvertError(
      ConvertErrorCode.InvalidSafeInteger,
      value,
      "safe-integer",
      "not-safe-integer"
    );
  }

  return parsed;
}

export function toBooleanValue(
  value: unknown
): Result<boolean, typeof ConvertErrorCode.InvalidBoolean, ConvertErrorPayload> {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return createConvertError(ConvertErrorCode.InvalidBoolean, value, "boolean", "not-boolean");
}

export function toRecordValue(
  value: unknown
): Result<Record<PropertyKey, unknown>, typeof ConvertErrorCode.InvalidRecord, ConvertErrorPayload> {
  if (!isObjectRecord(value)) {
    return createConvertError(ConvertErrorCode.InvalidRecord, value, "record", "not-record");
  }

  return value;
}
