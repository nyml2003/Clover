import { type Option } from "@clover/protocol";
export declare function isAsciiWhitespaceChar(value: string): boolean;
export declare function isAsciiAlphaChar(value: string): boolean;
export declare function isAsciiDigitChar(value: string): boolean;
export declare function isAsciiHexChar(value: string): boolean;
export declare function splitOnce(input: string, separator: string): Option<readonly [string, string]>;
export declare function startsWithAt(input: string, prefix: string, index: number): boolean;
export declare function endsWithAt(input: string, suffix: string, endExclusive?: number): boolean;
