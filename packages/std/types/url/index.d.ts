import { type CloverError, type Option, type Result, type SmiInt } from "@clover/protocol";
export declare const ParseHostPortErrorCode: {
    readonly InvalidHost: 1601;
    readonly InvalidPort: 1602;
};
type ParseHostPortErrorCodeValue = (typeof ParseHostPortErrorCode)[keyof typeof ParseHostPortErrorCode];
export type ParseHostPortErrorPayload = {
    input: string;
    reason: string;
};
export type ParseHostPortError = CloverError<ParseHostPortErrorCodeValue, ParseHostPortErrorPayload>;
export type ParsedHostPort = {
    host: string;
    port: Option<SmiInt>;
};
export type QueryParam = {
    key: string;
    value: Option<string>;
};
export declare const NormalizeUrlErrorCode: {
    readonly InvalidUrl: 1701;
};
export type NormalizeUrlErrorPayload = string;
export type SupportedScheme = "http" | "https";
export type NormalizedUrl = {
    scheme: SupportedScheme;
    host: string;
    port: number | null;
    path: string;
    query: string | null;
    normalizedHref: string;
};
export declare function parseHostPort(input: string): Result<ParsedHostPort, ParseHostPortErrorCodeValue, ParseHostPortErrorPayload>;
export declare function normalizeUrl(input: string): Result<NormalizedUrl, typeof NormalizeUrlErrorCode.InvalidUrl, NormalizeUrlErrorPayload>;
export declare function explainInvalidUrl(input: string): string | null;
export declare function parseQueryString(input: string): readonly QueryParam[];
export declare function buildQueryString(params: readonly QueryParam[]): string;
export {};
