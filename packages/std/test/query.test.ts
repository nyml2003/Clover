import { None } from "@clover.js/protocol";
import { describe, expect, it } from "vitest";

import {
  buildQueryString,
  getQueryParamCount,
  materializeQueryParams,
  parseQueryRecord,
  parseQueryString,
  readQueryKey,
  readQueryValue
} from "@clover.js/std";

describe("@clover.js/std query", () => {
  it("parses query strings into span views", () => {
    const parsed = parseQueryString("?a=1&flag&empty=&a=2&&");

    expect(parsed.source).toBe("a=1&flag&empty=&a=2&&");
    expect(getQueryParamCount(parsed)).toBe(4);
    expect(readQueryKey(parsed, 0)).toBe("a");
    expect(readQueryValue(parsed, 0)).toBe("1");
    expect(readQueryKey(parsed, 1)).toBe("flag");
    expect(readQueryValue(parsed, 1)).toBe(None);
    expect(materializeQueryParams(parsed)).toEqual([
      { key: "a", value: "1" },
      { key: "flag", value: None },
      { key: "empty", value: "" },
      { key: "a", value: "2" }
    ]);
  });

  it("builds canonical query strings from parsed views", () => {
    expect(buildQueryString(parseQueryString("?a=1&flag&empty="))).toBe("a=1&flag&empty=");
  });

  it("parses grouped query records directly for host lookup", () => {
    expect(parseQueryRecord("?a=1&flag&a=2")).toEqual({
      a: ["1", "2"],
      flag: [None]
    });
  });

  it("treats prototype-looking keys as normal query keys", () => {
    const grouped = parseQueryRecord("?constructor=1&__proto__=2&toString=3");

    expect(grouped.constructor).toEqual(["1"]);
    expect(grouped["__proto__"]).toEqual(["2"]);
    expect(grouped.toString).toEqual(["3"]);
    expect(Object.getPrototypeOf(grouped)).toBeNull();
  });
});
