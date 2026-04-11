import {
  createError,
  isError,
  type CloverError,
  type ErrorPayload,
  type Result
} from "@clover/protocol";

export function ok<T>(value: T): Result<T, never, never> {
  return value;
}

export function err<ErrorCodeEnum extends number, Payload extends ErrorPayload>(
  errCode: ErrorCodeEnum,
  payload: Payload
): CloverError<ErrorCodeEnum, Payload> {
  return createError(errCode, payload);
}

export function mapResult<T, U, ErrorCode extends number, Payload extends ErrorPayload>(
  result: Result<T, ErrorCode, Payload>,
  map: (value: T) => U
): Result<U, ErrorCode, Payload> {
  return isError(result) ? result : map(result);
}

export function mapErr<
  T,
  InputCode extends number,
  InputPayload extends ErrorPayload,
  OutputCode extends number,
  OutputPayload extends ErrorPayload
>(
  result: Result<T, InputCode, InputPayload>,
  map: (error: CloverError<InputCode, InputPayload>) => CloverError<OutputCode, OutputPayload>
): Result<T, OutputCode, OutputPayload> {
  return isError(result) ? map(result) : result;
}

export function andThenResult<
  T,
  U,
  InputCode extends number,
  InputPayload extends ErrorPayload,
  OutputCode extends number,
  OutputPayload extends ErrorPayload
>(
  result: Result<T, InputCode, InputPayload>,
  map: (value: T) => Result<U, OutputCode, OutputPayload>
): Result<U, InputCode | OutputCode, InputPayload | OutputPayload> {
  return isError(result) ? result : map(result);
}

export function unwrapOr<T, ErrorCode extends number, Payload extends ErrorPayload>(
  result: Result<T, ErrorCode, Payload>,
  fallback: T
): T {
  return isError(result) ? fallback : result;
}

export function matchResult<
  T,
  UOk,
  UErr,
  ErrorCode extends number,
  Payload extends ErrorPayload
>(
  result: Result<T, ErrorCode, Payload>,
  onOk: (value: NoInfer<T>) => UOk,
  onErr: (error: CloverError<ErrorCode, Payload>) => UErr
): UOk | UErr {
  return isError(result) ? onErr(result) : onOk(result);
}
