import { None, type None as NoneValue } from "./sentinels.js";

export type ErrorScalarData = NoneValue | string | number | boolean;
export type ErrorObjectData = Record<string, ErrorScalarData>;
export type ErrorData = ErrorScalarData | ErrorObjectData;

export type CloverError<E extends ErrorData = ErrorData> = {
  __code__: number;
  data: E;
};

export function createError<E extends ErrorData>(code: number, data: E): CloverError<E> {
  return {
    __code__: code,
    data
  };
}

export function isErrorScalarData(value: unknown): value is ErrorScalarData {
  return (
    value === None ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

export function isErrorObjectData(value: unknown): value is ErrorObjectData {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  for (const key of Object.keys(value)) {
    const candidate = (value as Record<string, unknown>)[key];
    if (!isErrorScalarData(candidate)) {
      return false;
    }
  }

  return true;
}

export function isErrorData(value: unknown): value is ErrorData {
  return isErrorScalarData(value) || isErrorObjectData(value);
}

export function isError<E extends ErrorData = ErrorData>(value: unknown): value is CloverError<E> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as { __code__?: unknown; data?: unknown };

  return (
    typeof candidate.__code__ === "number" &&
    Object.prototype.hasOwnProperty.call(candidate, "data")
  );
}
