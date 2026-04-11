export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

export function isFunction<TArgs extends unknown[] = unknown[], TResult = unknown>(
  value: unknown
): value is (...args: TArgs) => TResult {
  return typeof value === "function";
}

export function isObjectRecord(value: unknown): value is Record<PropertyKey, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isArrayValue<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}
