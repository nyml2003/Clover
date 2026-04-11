export type ErrorScalarPayload = string | number | boolean;
export type ErrorObjectPayload = Record<string, ErrorScalarPayload>;
export type ErrorPayload = ErrorScalarPayload | ErrorObjectPayload;

export type CloverError<
  ErrorCode extends number = number,
  Payload extends ErrorPayload = ErrorPayload
> = {
  __code__: ErrorCode;
  payload: Payload;
};

export function createError<ErrorCodeEnum extends number, Payload extends ErrorPayload>(
  errCode: ErrorCodeEnum,
  payload: Payload
): CloverError<ErrorCodeEnum, Payload> {
  return {
    __code__: errCode,
    payload
  };
}

export function isErrorScalarPayload(value: unknown): value is ErrorScalarPayload {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

export function isErrorObjectPayload(value: unknown): value is ErrorObjectPayload {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  for (const key of Object.keys(value)) {
    const candidate = (value as Record<string, unknown>)[key];
    if (!isErrorScalarPayload(candidate)) {
      return false;
    }
  }

  return true;
}

export function isErrorPayload(value: unknown): value is ErrorPayload {
  return isErrorScalarPayload(value) || isErrorObjectPayload(value);
}

export function isError<
  ErrorCode extends number = number,
  Payload extends ErrorPayload = ErrorPayload
>(value: unknown): value is CloverError<ErrorCode, Payload> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as { __code__: unknown; payload: unknown };

  return (
    typeof candidate.__code__ === "number" &&
    Object.prototype.hasOwnProperty.call(candidate, "payload") &&
    isErrorPayload(candidate.payload)
  );
}
