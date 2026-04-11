import { type None as NoneValue } from "./sentinels.js";
export type ErrorScalarData = NoneValue | string | number | boolean;
export type ErrorObjectData = Record<string, ErrorScalarData>;
export type ErrorData = ErrorScalarData | ErrorObjectData;
export type CloverError<E extends ErrorData = ErrorData> = {
    __code__: number;
    data: E;
};
export declare function createError<E extends ErrorData>(code: number, data: E): CloverError<E>;
export declare function isErrorScalarData(value: unknown): value is ErrorScalarData;
export declare function isErrorObjectData(value: unknown): value is ErrorObjectData;
export declare function isErrorData(value: unknown): value is ErrorData;
export declare function isError<E extends ErrorData = ErrorData>(value: unknown): value is CloverError<E>;
