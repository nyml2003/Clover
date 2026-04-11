import { type CloverError, type Option, type Result } from "@clover/protocol";
import { z } from "zod";
export declare const ZodErrorCode: {
    readonly ParseFailed: 2001;
    readonly OptionalParseFailed: 2002;
    readonly NullableParseFailed: 2003;
    readonly OptionalNullableParseFailed: 2004;
};
type ZodErrorCodeValue = (typeof ZodErrorCode)[keyof typeof ZodErrorCode];
export type ZodBoundaryMode = "parse" | "optional" | "nullable" | "optional-nullable";
export type ZodBoundaryErrorPayload = {
    mode: ZodBoundaryMode;
    inputKind: string;
    issueCount: number;
    firstPath: string;
    firstMessage: string;
};
export type ZodBoundaryError = CloverError<ZodErrorCodeValue, ZodBoundaryErrorPayload>;
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
export declare function fromSafeParse<T, ErrorCode extends ZodErrorCodeValue>(result: SafeParseResult<T>, code: ErrorCode, mode: ZodBoundaryMode, input: unknown): Result<T, ErrorCode, ZodBoundaryErrorPayload>;
export declare function parseWith<Schema extends z.ZodType>(schema: Schema, input: unknown): Result<z.output<Schema>, typeof ZodErrorCode.ParseFailed, ZodBoundaryErrorPayload>;
export declare function parseOptionalWith<Schema extends z.ZodType>(schema: Schema, input: unknown): Result<Option<z.output<Schema>>, typeof ZodErrorCode.OptionalParseFailed, ZodBoundaryErrorPayload>;
export declare function parseNullableWith<Schema extends z.ZodType>(schema: Schema, input: unknown): Result<Option<z.output<Schema>>, typeof ZodErrorCode.NullableParseFailed, ZodBoundaryErrorPayload>;
export declare function parseOptionalNullableWith<Schema extends z.ZodType>(schema: Schema, input: unknown): Result<Option<z.output<Schema>>, typeof ZodErrorCode.OptionalNullableParseFailed, ZodBoundaryErrorPayload>;
export declare function unwrapParsedOption<T>(result: Result<Option<T>, ZodErrorCodeValue, ZodBoundaryErrorPayload>): {
    ok: true;
    value: Option<T>;
} | {
    ok: false;
    error: ZodBoundaryError;
};
export {};
