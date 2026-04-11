import { type CloverError, type ErrorPayload, type Result } from "@clover/protocol";
export declare const CollectAsyncLimitedErrorCode: {
    readonly InvalidLimit: 1101;
    readonly LimitExceeded: 1102;
};
type CollectAsyncLimitedErrorCodeValue = (typeof CollectAsyncLimitedErrorCode)[keyof typeof CollectAsyncLimitedErrorCode];
export type CollectAsyncLimitedErrorPayload = {
    reason: string;
    limit: number;
    count: number;
};
export type CollectAsyncLimitedError = CloverError<CollectAsyncLimitedErrorCodeValue, CollectAsyncLimitedErrorPayload>;
export declare const BufferAsyncChunksErrorCode: {
    readonly InvalidChunkSize: 1201;
};
type BufferAsyncChunksErrorCodeValue = (typeof BufferAsyncChunksErrorCode)[keyof typeof BufferAsyncChunksErrorCode];
export type BufferAsyncChunksErrorPayload = {
    reason: string;
    size: number;
};
export type BufferAsyncChunksError = CloverError<BufferAsyncChunksErrorCodeValue, BufferAsyncChunksErrorPayload>;
export declare const SliceAsyncErrorCode: {
    readonly InvalidCount: 1301;
};
type SliceAsyncErrorCodeValue = (typeof SliceAsyncErrorCode)[keyof typeof SliceAsyncErrorCode];
export type SliceAsyncErrorPayload = {
    reason: string;
    count: number;
};
export type SliceAsyncError = CloverError<SliceAsyncErrorCodeValue, SliceAsyncErrorPayload>;
export declare const SplitAsyncByDelimiterErrorCode: {
    readonly InvalidDelimiter: 1401;
};
type SplitAsyncByDelimiterErrorCodeValue = (typeof SplitAsyncByDelimiterErrorCode)[keyof typeof SplitAsyncByDelimiterErrorCode];
export type SplitAsyncByDelimiterErrorPayload = {
    reason: string;
    delimiter: string;
};
export type SplitAsyncByDelimiterError = CloverError<SplitAsyncByDelimiterErrorCodeValue, SplitAsyncByDelimiterErrorPayload>;
export declare function collectAsyncLimited<T>(source: AsyncIterable<T>, limit: number): Promise<Result<readonly T[], CollectAsyncLimitedErrorCodeValue, CollectAsyncLimitedErrorPayload>>;
export declare function bufferAsyncChunks<T>(source: AsyncIterable<T>, size: number): Result<AsyncIterable<readonly T[]>, BufferAsyncChunksErrorCodeValue, BufferAsyncChunksErrorPayload>;
export declare function takeAsync<T>(source: AsyncIterable<T>, count: number): Result<AsyncIterable<T>, SliceAsyncErrorCodeValue, SliceAsyncErrorPayload>;
export declare function skipAsync<T>(source: AsyncIterable<T>, count: number): Result<AsyncIterable<T>, SliceAsyncErrorCodeValue, SliceAsyncErrorPayload>;
export declare function stopAsyncWhen<T>(source: AsyncIterable<T>, shouldStop: (item: T, index: number) => boolean): AsyncIterable<T>;
export declare function splitAsyncByDelimiter(source: AsyncIterable<string>, delimiter: string): Result<AsyncIterable<string>, SplitAsyncByDelimiterErrorCodeValue, SplitAsyncByDelimiterErrorPayload>;
export declare function concatAsync<T>(...sources: readonly AsyncIterable<T>[]): AsyncIterable<T>;
export declare function mergeAsync<T>(...sources: readonly AsyncIterable<T>[]): AsyncIterable<T>;
export declare function mapAsyncResult<T, U, InputCode extends number, InputPayload extends ErrorPayload, OutputCode extends number, OutputPayload extends ErrorPayload>(source: AsyncIterable<Result<T, InputCode, InputPayload>>, map: (value: T, index: number) => Result<U, OutputCode, OutputPayload> | Promise<Result<U, OutputCode, OutputPayload>>): AsyncIterable<Result<U, InputCode | OutputCode, InputPayload | OutputPayload>>;
export {};
