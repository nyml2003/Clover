import { None } from "@clover/protocol";
import { describe, expect, it } from "vitest";

import {
  buildQueryString,
  getQueryParamValues,
  parseQueryString,
  toQueryRecord
} from "@clover/std";

describe("@clover/std query", () => {
  it("parses query strings into fixed-shape entries", () => {
    expect(parseQueryString("?a=1&flag&empty=&a=2&&")).toEqual([
      { key: "a", value: "1" },
      { key: "flag", value: None },
      { key: "empty", value: "" },
      { key: "a", value: "2" }
    ]);
  });

  it("builds query strings from parsed entries", () => {
    expect(
      buildQueryString([
        { key: "a", value: "1" },
        { key: "flag", value: None },
        { key: "empty", value: "" }
      ])
    ).toBe("a=1&flag&empty=");
  });

  it("returns all values for a given key and exposes a grouped record", () => {
    const parsed = parseQueryString("?a=1&flag&a=2");
    expect(getQueryParamValues(parsed, "a")).toEqual(["1", "2"]);
    expect(getQueryParamValues(parsed, "flag")).toEqual([None]);
    expect(toQueryRecord(parsed)).toEqual({
      a: ["1", "2"],
      flag: [None]
    });
  });
});
