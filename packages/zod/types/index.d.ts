import { type CloverError, type None as NoneValue, type Option, type Result } from "@clover/protocol";
import { z } from "zod";
export declare const ZodErrorCode: {
    readonly ParseFailed: 2001;
    readonly OptionalParseFailed: 2002;
    readonly NullableParseFailed: 2003;
    readonly OptionalNullableParseFailed: 2004;
};
export type ZodBoundaryMode = "parse" | "optional" | "nullable" | "optional-nullable";
export type ZodBoundaryErrorData = {
    mode: ZodBoundaryMode;
    inputKind: string;
    issueCount: number;
    firstPath: string | NoneValue;
    firstMessage: string | NoneValue;
};
export type ZodBoundaryError = CloverError<ZodBoundaryErrorData>;
type ZodIssueLike = {
    path: readonly PropertyKey[];
    message: string;
};
type SafeParseResult<T> = {
    success: true;
    data: T;
} | {
    success: false;
    error: {
        issues: readonly ZodIssueLike[];
    };
};
export declare function fromSafeParse<T>(result: SafeParseResult<T>, code: number, mode: ZodBoundaryMode, input: unknown): Result<T, ZodBoundaryErrorData>;
export declare function parseWith<Schema extends z.ZodType>(schema: Schema, input: unknown): Result<z.output<Schema>, ZodBoundaryErrorData>;
export declare function parseOptionalWith<Schema extends z.ZodType>(schema: Schema, input: unknown): Result<Option<z.output<Schema>>, ZodBoundaryErrorData>;
export declare function parseNullableWith<Schema extends z.ZodType>(schema: Schema, input: unknown): Result<Option<z.output<Schema>>, ZodBoundaryErrorData>;
export declare function parseOptionalNullableWith<Schema extends z.ZodType>(schema: Schema, input: unknown): Result<Option<z.output<Schema>>, ZodBoundaryErrorData>;
export declare function unwrapParsedOption<T>(result: Result<Option<T>, ZodBoundaryErrorData>): {
    ok: true;
    value: Option<T>;
} | {
    ok: false;
    error: ZodBoundaryError;
};
export {};
