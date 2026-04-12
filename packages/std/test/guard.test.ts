import { describe, expect, it } from "vitest";

import {
  isArrayValue,
  isFunction,
  isNumber,
  isObjectRecord,
  isString
} from "@clover.js/std";

describe("@clover.js/std guard", () => {
  it("narrows primitive and collection values", () => {
    expect(isString("value")).toBe(true);
    expect(isString(1)).toBe(false);
    expect(isNumber(1)).toBe(true);
    expect(isNumber("1")).toBe(false);
    expect(isFunction(() => 1)).toBe(true);
    expect(isFunction("fn")).toBe(false);
    expect(isObjectRecord({ a: 1 })).toBe(true);
    expect(isObjectRecord(null)).toBe(false);
    expect(isObjectRecord([1, 2, 3])).toBe(false);
    expect(isArrayValue([1, 2, 3])).toBe(true);
  });
});
