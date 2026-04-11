import { type CloverError, type FiniteFloat64, type None as NoneValue, type Result, type SmiInt } from "@clover/protocol";
export declare const NumberErrorCode: {
    readonly InvalidSmiInt: 1001;
    readonly InvalidFiniteFloat64: 1002;
};
export type NumberErrorData = {
    input: string;
    reason: string | NoneValue;
};
export type NumberError = CloverError<NumberErrorData>;
export declare function parseSmiInt(input: string): Result<SmiInt, NumberErrorData>;
export declare function parseFiniteFloat64(input: string): Result<FiniteFloat64, NumberErrorData>;
export declare function inRange(value: number, min: number, max: number): boolean;
export declare function clamp(value: number, min: number, max: number): number;
export declare function isFiniteNumberValue(value: unknown): value is number;
