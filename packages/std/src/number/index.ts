import {
  createError,
  type CloverError,
  type FiniteFloat64,
  type Result,
  type SmiInt
} from "@clover/protocol";

const MAX_SMI_INT = 2_147_483_647;
const MIN_SMI_INT = -2_147_483_648;

export const NumberErrorCode = {
  InvalidSmiInt: 1001,
  InvalidFiniteFloat64: 1002
} as const;

type NumberErrorCodeValue = (typeof NumberErrorCode)[keyof typeof NumberErrorCode];

export type NumberErrorPayload = {
  input: string;
  reason: string;
};

export type NumberError = CloverError<NumberErrorCodeValue, NumberErrorPayload>;

function createNumberError<ErrorCode extends NumberErrorCodeValue>(
  code: ErrorCode,
  input: string,
  reason: string
): CloverError<ErrorCode, NumberErrorPayload> {
  return createError(code, {
    input,
    reason
  });
}

export function parseSmiInt(
  input: string
): Result<SmiInt, typeof NumberErrorCode.InvalidSmiInt, NumberErrorPayload> {
  if (input.length === 0) {
    return createNumberError(NumberErrorCode.InvalidSmiInt, input, "empty");
  }

  let index = 0;
  let sign = 1;
  const firstCode = input.charCodeAt(0);

  if (firstCode === 0x2b) {
    index = 1;
  } else if (firstCode === 0x2d) {
    sign = -1;
    index = 1;
  }

  if (index === input.length) {
    return createNumberError(NumberErrorCode.InvalidSmiInt, input, "sign-only");
  }

  let value = 0;

  for (; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    if (code < 0x30 || code > 0x39) {
      return createNumberError(NumberErrorCode.InvalidSmiInt, input, "non-digit");
    }

    value = value * 10 + (code - 0x30);
    if (sign === 1 && value > MAX_SMI_INT) {
      return createNumberError(NumberErrorCode.InvalidSmiInt, input, "overflow");
    }

    if (sign === -1 && value > Math.abs(MIN_SMI_INT)) {
      return createNumberError(NumberErrorCode.InvalidSmiInt, input, "overflow");
    }
  }

  const signedValue = sign === 1 ? value : -value;
  if (signedValue < MIN_SMI_INT || signedValue > MAX_SMI_INT) {
    return createNumberError(NumberErrorCode.InvalidSmiInt, input, "overflow");
  }

  return signedValue as SmiInt;
}

export function parseFiniteFloat64(
  input: string
): Result<FiniteFloat64, typeof NumberErrorCode.InvalidFiniteFloat64, NumberErrorPayload> {
  if (input.length === 0 || input.trim() !== input) {
    return createNumberError(NumberErrorCode.InvalidFiniteFloat64, input, "invalid-format");
  }

  const value = Number(input);
  if (!Number.isFinite(value)) {
    return createNumberError(NumberErrorCode.InvalidFiniteFloat64, input, "non-finite");
  }

  return value as FiniteFloat64;
}

export function inRange(value: number, min: number, max: number): boolean {
  const lower = min <= max ? min : max;
  const upper = min <= max ? max : min;

  return value >= lower && value <= upper;
}

export function clamp(value: number, min: number, max: number): number {
  const lower = min <= max ? min : max;
  const upper = min <= max ? max : min;

  if (value < lower) {
    return lower;
  }

  if (value > upper) {
    return upper;
  }

  return value;
}

export function isFiniteNumberValue(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isSafeIntegerNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value);
}

export function compareNumber(left: number, right: number): -1 | 0 | 1 {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}

export function signOfNumber(value: number): -1 | 0 | 1 {
  return compareNumber(value, 0);
}
