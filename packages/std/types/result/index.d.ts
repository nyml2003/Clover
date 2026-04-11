import { type CloverError, type ErrorPayload, type Result } from "@clover/protocol";
export declare function ok<T>(value: T): Result<T, never, never>;
export declare function err<ErrorCodeEnum extends number, Payload extends ErrorPayload>(errCode: ErrorCodeEnum, payload: Payload): CloverError<ErrorCodeEnum, Payload>;
export declare function mapResult<T, U, ErrorCode extends number, Payload extends ErrorPayload>(result: Result<T, ErrorCode, Payload>, map: (value: T) => U): Result<U, ErrorCode, Payload>;
export declare function mapErr<T, InputCode extends number, InputPayload extends ErrorPayload, OutputCode extends number, OutputPayload extends ErrorPayload>(result: Result<T, InputCode, InputPayload>, map: (error: CloverError<InputCode, InputPayload>) => CloverError<OutputCode, OutputPayload>): Result<T, OutputCode, OutputPayload>;
export declare function andThenResult<T, U, InputCode extends number, InputPayload extends ErrorPayload, OutputCode extends number, OutputPayload extends ErrorPayload>(result: Result<T, InputCode, InputPayload>, map: (value: T) => Result<U, OutputCode, OutputPayload>): Result<U, InputCode | OutputCode, InputPayload | OutputPayload>;
export declare function unwrapOr<T, ErrorCode extends number, Payload extends ErrorPayload>(result: Result<T, ErrorCode, Payload>, fallback: T): T;
export declare function matchResult<T, U, ErrorCode extends number, Payload extends ErrorPayload>(result: Result<T, ErrorCode, Payload>, onOk: (value: T) => U, onErr: (error: CloverError<ErrorCode, Payload>) => U): U;
