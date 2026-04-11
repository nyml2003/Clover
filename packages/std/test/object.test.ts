import { describe, expect, it } from "vitest";

import { hasOwn, shallowClone, shallowMerge, typedEntries, typedKeys } from "@clover/std";

describe("@clover/std object", () => {
  it("checks own properties safely", () => {
    const value = Object.create({ inherited: true }) as { answer: number; inherited?: boolean };
    value.answer = 42;
    expect(hasOwn(value, "answer")).toBe(true);
    expect(hasOwn(value, "missing")).toBe(false);
    expect(hasOwn(value, "inherited")).toBe(false);
  });

  it("returns typed keys and entries", () => {
    const value = { answer: 42, label: "ok" };
    expect(typedKeys(value)).toEqual(["answer", "label"]);
    expect(typedEntries(value)).toEqual([
      ["answer", 42],
      ["label", "ok"]
    ]);
    expect(typedKeys({})).toEqual([]);
    expect(typedEntries({})).toEqual([]);
  });

  it("performs shallow clone and merge without deleting fields", () => {
    const source = { answer: 42, nested: { ok: true } };
    const clone = shallowClone(source);
    const merged = shallowMerge(source, { label: "done" });

    expect(clone).toEqual(source);
    expect(clone).not.toBe(source);
    expect(clone.nested).toBe(source.nested);
    expect(merged).toEqual({ answer: 42, nested: { ok: true }, label: "done" });
  });
});
