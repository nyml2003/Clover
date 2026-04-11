export type ErrorScalarPayload = string | number | boolean;
export type ErrorObjectPayload = Record<string, ErrorScalarPayload>;
export type ErrorPayload = ErrorScalarPayload | ErrorObjectPayload;
export type CloverError<ErrorCode extends number = number, Payload extends ErrorPayload = ErrorPayload> = {
    __code__: ErrorCode;
    payload: Payload;
};
export declare function createError<ErrorCodeEnum extends number, Payload extends ErrorPayload>(errCode: ErrorCodeEnum, payload: Payload): CloverError<ErrorCodeEnum, Payload>;
export declare function isErrorScalarPayload(value: unknown): value is ErrorScalarPayload;
export declare function isErrorObjectPayload(value: unknown): value is ErrorObjectPayload;
export declare function isErrorPayload(value: unknown): value is ErrorPayload;
export declare function isError<ErrorCode extends number = number, Payload extends ErrorPayload = ErrorPayload>(value: unknown): value is CloverError<ErrorCode, Payload>;
