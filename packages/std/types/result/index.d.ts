import { type CloverError, type ErrorData, type Result } from "@clover/protocol";
export declare function ok<T>(value: T): Result<T, never>;
export declare function err<E extends ErrorData>(code: number, data: E): CloverError<E>;
export declare function mapResult<T, U, E extends ErrorData>(result: Result<T, E>, map: (value: T) => U): Result<U, E>;
export declare function mapErr<T, E extends ErrorData, F extends ErrorData>(result: Result<T, E>, map: (error: CloverError<E>) => CloverError<F>): Result<T, F>;
export declare function andThenResult<T, U, E extends ErrorData, F extends ErrorData>(result: Result<T, E>, map: (value: T) => Result<U, F>): Result<U, E | F>;
export declare function unwrapOr<T, E extends ErrorData>(result: Result<T, E>, fallback: T): T;
export declare function matchResult<T, U, E extends ErrorData>(result: Result<T, E>, onOk: (value: T) => U, onErr: (error: CloverError<E>) => U): U;
