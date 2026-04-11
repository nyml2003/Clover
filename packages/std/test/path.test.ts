import { describe, expect, it } from "vitest";

import { normalizePathSegments } from "@clover/std";

describe("@clover/std path", () => {
  it("normalizes relative paths by removing dot segments", () => {
    expect(normalizePathSegments("a/./b//c")).toBe("a/b/c");
    expect(normalizePathSegments("./a/../b")).toBe("b");
    expect(normalizePathSegments("../a/../../b")).toBe("../../b");
  });

  it("normalizes absolute paths without escaping above root", () => {
    expect(normalizePathSegments("/a/./b/../c")).toBe("/a/c");
    expect(normalizePathSegments("/../../a")).toBe("/a");
    expect(normalizePathSegments("/")).toBe("/");
  });

  it("preserves trailing slashes when the normalized path still has content", () => {
    expect(normalizePathSegments("a/b/")).toBe("a/b/");
    expect(normalizePathSegments("/a/b/")).toBe("/a/b/");
  });

  it("returns dot for empty relative paths", () => {
    expect(normalizePathSegments("")).toBe(".");
    expect(normalizePathSegments("./")).toBe(".");
  });
});
