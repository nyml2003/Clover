import {
  createError,
  isError,
  type CloverError,
  type ErrorData,
  type Result
} from "@clover/protocol";

export function ok<T>(value: T): Result<T, never> {
  return value;
}

export function err<E extends ErrorData>(code: number, data: E): CloverError<E> {
  return createError(code, data);
}

export function mapResult<T, U, E extends ErrorData>(
  result: Result<T, E>,
  map: (value: T) => U
): Result<U, E> {
  return isError(result) ? result : map(result);
}

export function mapErr<T, E extends ErrorData, F extends ErrorData>(
  result: Result<T, E>,
  map: (error: CloverError<E>) => CloverError<F>
): Result<T, F> {
  return isError(result) ? map(result) : result;
}

export function andThenResult<T, U, E extends ErrorData, F extends ErrorData>(
  result: Result<T, E>,
  map: (value: T) => Result<U, F>
): Result<U, E | F> {
  return isError(result) ? result : map(result);
}

export function unwrapOr<T, E extends ErrorData>(result: Result<T, E>, fallback: T): T {
  return isError(result) ? fallback : result;
}

export function matchResult<T, U, E extends ErrorData>(
  result: Result<T, E>,
  onOk: (value: T) => U,
  onErr: (error: CloverError<E>) => U
): U {
  return isError(result) ? onErr(result) : onOk(result);
}
