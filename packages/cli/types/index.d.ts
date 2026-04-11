import { type CloverError, type ErrorPayload, type Result } from "@clover/protocol";
import { type ZodBoundaryErrorPayload } from "@clover/zod";
import { type z } from "zod";
export declare const CliErrorCode: {
    readonly MissingArgs: 3001;
};
type CliErrorCodeValue = (typeof CliErrorCode)[keyof typeof CliErrorCode];
export type CliErrorPayload = {
    reason: string;
    usage: string;
};
export type CliRenderSuccess = {
    exitCode: number;
    stdout: string;
};
export type CliRenderFailure<ErrorCode extends number = number, Payload extends ErrorPayload = ErrorPayload> = {
    exitCode: number;
    stderr: string;
    error: CloverError<ErrorCode, Payload>;
};
export type CliRenderResult<ErrorCode extends number = number, Payload extends ErrorPayload = ErrorPayload> = CliRenderSuccess | CliRenderFailure<ErrorCode, Payload>;
export type ExitCodeMapping = Partial<Record<number, number>>;
export type RenderCliResultOptions<T, ErrorCode extends number = number, Payload extends ErrorPayload = ErrorPayload> = {
    argv?: readonly string[];
    usage?: string;
    requireArgs?: boolean;
    execute: (args: readonly string[]) => Result<T, ErrorCode, Payload>;
    onSuccess: (value: T) => string;
    mapExitCode?: ExitCodeMapping;
    fallbackErrorMessage?: string;
};
export type CliIO = {
    writeStdout: (text: string) => void;
    writeStderr: (text: string) => void;
};
export declare function readArgv(argv?: readonly string[]): readonly string[];
export declare function formatCliError(error: CloverError, fallbackMessage?: string): string;
export declare function toExitCode(error: CloverError, mapping?: ExitCodeMapping): number;
export declare function renderCliResult<T, ErrorCode extends number = number, Payload extends ErrorPayload = ErrorPayload>(options: RenderCliResultOptions<T, ErrorCode, Payload>): CliRenderResult<ErrorCode | CliErrorCodeValue, Payload | CliErrorPayload>;
export declare function emitCliRender<ErrorCode extends number = number, Payload extends ErrorPayload = ErrorPayload>(rendered: CliRenderResult<ErrorCode, Payload>, io?: CliIO): number;
export declare function parseArgvWith<Schema extends z.ZodType>(schema: Schema, argv?: readonly string[]): Result<z.output<Schema>, number, ZodBoundaryErrorPayload>;
export {};
