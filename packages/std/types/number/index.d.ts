import { type CloverError, type FiniteFloat64, type Result, type SmiInt } from "@clover/protocol";
export declare const NumberErrorCode: {
    readonly InvalidSmiInt: 1001;
    readonly InvalidFiniteFloat64: 1002;
};
type NumberErrorCodeValue = (typeof NumberErrorCode)[keyof typeof NumberErrorCode];
export type NumberErrorPayload = {
    input: string;
    reason: string;
};
export type NumberError = CloverError<NumberErrorCodeValue, NumberErrorPayload>;
export declare function parseSmiInt(input: string): Result<SmiInt, typeof NumberErrorCode.InvalidSmiInt, NumberErrorPayload>;
export declare function parseFiniteFloat64(input: string): Result<FiniteFloat64, typeof NumberErrorCode.InvalidFiniteFloat64, NumberErrorPayload>;
export declare function inRange(value: number, min: number, max: number): boolean;
export declare function clamp(value: number, min: number, max: number): number;
export declare function isFiniteNumberValue(value: unknown): value is number;
export declare function isSafeIntegerNumber(value: unknown): value is number;
export declare function compareNumber(left: number, right: number): -1 | 0 | 1;
export declare function signOfNumber(value: number): -1 | 0 | 1;
export {};
