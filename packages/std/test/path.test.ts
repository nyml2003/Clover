import { describe, expect, it } from "vitest";

import {
  getPathSegmentCount,
  joinPathSegments,
  materializePathSegments,
  normalizePathSegments,
  parsePath,
  readPathSegment,
  splitPathSegments
} from "@clover.js/std";

describe("@clover.js/std path", () => {
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

  it("parses path metadata into span views over the normalized path", () => {
    const parsed = parsePath("/a/./b/../c/");

    expect(parsed).toEqual({
      isAbsolute: true,
      hasTrailingSlash: true,
      normalized: "/a/c/",
      segmentBounds: [1, 2, 3, 4]
    });
    expect(getPathSegmentCount(parsed)).toBe(2);
    expect(readPathSegment(parsed, 0)).toBe("a");
    expect(readPathSegment(parsed, 1)).toBe("c");
    expect(materializePathSegments(parsed)).toEqual(["a", "c"]);
    expect(parsePath("./")).toEqual({
      isAbsolute: false,
      hasTrailingSlash: false,
      normalized: ".",
      segmentBounds: []
    });
  });
});
