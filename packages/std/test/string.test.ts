import { describe, expect, it } from "vitest";

import { None } from "@clover/protocol";
import {
  endsWithAt,
  isAsciiAlphaChar,
  isAsciiDigitChar,
  isAsciiHexChar,
  isAsciiWhitespaceChar,
  splitOnce,
  startsWithAt
} from "@clover/std";

describe("@clover/std string", () => {
  it("checks ascii character classes one character at a time", () => {
    expect(isAsciiWhitespaceChar(" ")).toBe(true);
    expect(isAsciiWhitespaceChar("\n")).toBe(true);
    expect(isAsciiWhitespaceChar("")).toBe(false);
    expect(isAsciiWhitespaceChar("ab")).toBe(false);
    expect(isAsciiAlphaChar("A")).toBe(true);
    expect(isAsciiAlphaChar("z")).toBe(true);
    expect(isAsciiAlphaChar("")).toBe(false);
    expect(isAsciiAlphaChar("9")).toBe(false);
    expect(isAsciiDigitChar("7")).toBe(true);
    expect(isAsciiDigitChar("")).toBe(false);
    expect(isAsciiDigitChar("a")).toBe(false);
    expect(isAsciiHexChar("f")).toBe(true);
    expect(isAsciiHexChar("")).toBe(false);
    expect(isAsciiHexChar("G")).toBe(false);
  });

  it("splits only once for parse-friendly workflows", () => {
    expect(splitOnce("a=b=c", "=")).toEqual(["a", "b=c"]);
    expect(splitOnce("abc", "=")).toBe(None);
    expect(splitOnce("abc", "")).toBe(None);
  });

  it("matches prefixes and suffixes at explicit offsets", () => {
    expect(startsWithAt("protocol", "proto", 0)).toBe(true);
    expect(startsWithAt("protocol", "tocol", 3)).toBe(true);
    expect(startsWithAt("protocol", "tocol", -1)).toBe(false);
    expect(startsWithAt("protocol", "tocol", 10)).toBe(false);
    expect(endsWithAt("protocol", "col")).toBe(true);
    expect(endsWithAt("protocol", "oto", 5)).toBe(true);
    expect(endsWithAt("protocol", "col", 4)).toBe(false);
    expect(endsWithAt("protocol", "col", -1)).toBe(false);
  });
});
