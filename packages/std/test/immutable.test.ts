import { describe, expect, it } from "vitest";

import {
  appendValue,
  patchRecord,
  prependValue,
  removeAt,
  replaceAt,
  setRecordField
} from "@clover.js/std";

describe("@clover.js/std immutable", () => {
  it("performs immutable array updates", () => {
    const source = [1, 2, 3] as const;

    expect(appendValue(source, 4)).toEqual([1, 2, 3, 4]);
    expect(prependValue(source, 0)).toEqual([0, 1, 2, 3]);
    expect(replaceAt(source, 1, 9)).toEqual([1, 9, 3]);
    expect(removeAt(source, 1)).toEqual([1, 3]);
  });

  it("returns the original array when an update is a no-op", () => {
    const source = [1, 2, 3] as const;

    expect(replaceAt(source, 9, 4)).toBe(source);
    expect(replaceAt(source, 1, 2)).toBe(source);
    expect(removeAt(source, 9)).toBe(source);
  });

  it("performs immutable record updates without deleting fields", () => {
    const source = {
      answer: 42,
      label: "ok"
    };

    expect(setRecordField(source, "answer", 64)).toEqual({
      answer: 64,
      label: "ok"
    });
    expect(patchRecord(source, { label: "done" })).toEqual({
      answer: 42,
      label: "done"
    });
  });

  it("returns the original record when a patch does not change anything", () => {
    const source = {
      answer: 42,
      label: "ok"
    };

    expect(setRecordField(source, "answer", 42)).toBe(source);
    expect(patchRecord(source, { label: "ok" })).toBe(source);
  });
});
