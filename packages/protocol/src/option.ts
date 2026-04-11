import { None, type None as NoneValue } from "./sentinels.js";

export type Option<T> = T | NoneValue;

export function isNone(value: unknown): value is NoneValue {
  return value === None;
}
