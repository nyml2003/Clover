import { describe, expect, it } from "vitest";

import { joinPathSegments, normalizePathSegments, parsePath, splitPathSegments } from "@clover/std";

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

  it("splits normalized path segments and joins them again", () => {
    expect(splitPathSegments("/a/b/c")).toEqual(["a", "b", "c"]);
    expect(splitPathSegments("./")).toEqual([]);
    expect(joinPathSegments(["a", "b", "c"])).toBe("a/b/c");
    expect(joinPathSegments(["a", "b"], true, true)).toBe("/a/b/");
  });

  it("parses path metadata as a fixed-shape object", () => {
    expect(parsePath("/a/./b/../c/")).toEqual({
      isAbsolute: true,
      hasTrailingSlash: true,
      normalized: "/a/c/",
      segments: ["a", "c"]
    });
    expect(parsePath("./")).toEqual({
      isAbsolute: false,
      hasTrailingSlash: false,
      normalized: ".",
      segments: []
    });
  });
});
