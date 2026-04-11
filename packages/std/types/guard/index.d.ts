export declare function isString(value: unknown): value is string;
export declare function isNumber(value: unknown): value is number;
export declare function isFunction<TArgs extends unknown[] = unknown[], TResult = unknown>(value: unknown): value is (...args: TArgs) => TResult;
export declare function isObjectRecord(value: unknown): value is Record<PropertyKey, unknown>;
export declare function isArrayValue<T = unknown>(value: unknown): value is T[];
