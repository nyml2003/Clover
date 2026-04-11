import { type None as NoneValue } from "./sentinels.js";
export type Option<T> = T | NoneValue;
export declare function isNone(value: unknown): value is NoneValue;
