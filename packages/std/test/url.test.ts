import { None, isError } from "@clover/protocol";
import { describe, expect, it } from "vitest";

import {
  buildQueryString,
  explainInvalidUrl,
  normalizeUrl,
  parseHostPort,
  parseQueryString,
  ParseHostPortErrorCode
} from "@clover/std";

describe("@clover/std url", () => {
  it("parses host values with and without a port", () => {
    expect(parseHostPort("example.com")).toEqual({
      host: "example.com",
      port: None
    });
    expect(parseHostPort("LOCALHOST:8080")).toEqual({
      host: "LOCALHOST",
      port: 8080
    });
  });

  it("rejects malformed host labels", () => {
    expect(parseHostPort("")).toEqual({
      __code__: ParseHostPortErrorCode.InvalidHost,
      payload: {
        input: "",
        reason: "empty-host"
      }
    });
    expect(parseHostPort("-bad.example")).toEqual({
      __code__: ParseHostPortErrorCode.InvalidHost,
      payload: {
        input: "-bad.example",
        reason: "invalid-host-label"
      }
    });
    expect(parseHostPort("bad..example")).toEqual({
      __code__: ParseHostPortErrorCode.InvalidHost,
      payload: {
        input: "bad..example",
        reason: "invalid-host-label"
      }
    });
  });

  it("rejects unsupported authority syntax", () => {
    expect(parseHostPort("user@example.com")).toEqual({
      __code__: ParseHostPortErrorCode.InvalidHost,
      payload: {
        input: "user@example.com",
        reason: "user-info"
      }
    });
    expect(parseHostPort("[::1]")).toEqual({
      __code__: ParseHostPortErrorCode.InvalidHost,
      payload: {
        input: "[::1]",
        reason: "ipv6"
      }
    });
    expect(parseHostPort("example.com:80:90")).toEqual({
      __code__: ParseHostPortErrorCode.InvalidPort,
      payload: {
        input: "example.com:80:90",
        reason: "invalid-port-separator"
      }
    });
  });

  it("rejects invalid ports", () => {
    expect(parseHostPort("example.com:")).toEqual({
      __code__: ParseHostPortErrorCode.InvalidPort,
      payload: {
        input: "example.com:",
        reason: "missing-port"
      }
    });
    expect(parseHostPort("example.com:99999")).toEqual({
      __code__: ParseHostPortErrorCode.InvalidPort,
      payload: {
        input: "example.com:99999",
        reason: "out-of-range"
      }
    });
    expect(parseHostPort("example.com:8x")).toEqual({
      __code__: ParseHostPortErrorCode.InvalidPort,
      payload: {
        input: "example.com:8x",
        reason: "non-digit"
      }
    });
  });

  it("still composes with the shared error guard", () => {
    expect(isError(parseHostPort("example.com:bad"))).toBe(true);
    expect(isError(parseHostPort("example.com"))).toBe(false);
  });

  it("normalizes scheme, host, path, and default ports", () => {
    expect(normalizeUrl("HTTPS://Example.COM:443/docs?q=1")).toEqual({
      scheme: "https",
      host: "example.com",
      port: null,
      path: "/docs",
      query: "q=1",
      normalizedHref: "https://example.com/docs?q=1"
    });
  });

  it("keeps non-default ports and preserves query text", () => {
    expect(normalizeUrl("http://localhost:8080/path/to?a=1&a=2")).toEqual({
      scheme: "http",
      host: "localhost",
      port: 8080,
      path: "/path/to",
      query: "a=1&a=2",
      normalizedHref: "http://localhost:8080/path/to?a=1&a=2"
    });
  });

  it("fills in a root path when the input only has authority or query", () => {
    expect(normalizeUrl("http://example.com")).toEqual({
      scheme: "http",
      host: "example.com",
      port: null,
      path: "/",
      query: null,
      normalizedHref: "http://example.com/"
    });

    expect(normalizeUrl("http://example.com?debug=1")).toEqual({
      scheme: "http",
      host: "example.com",
      port: null,
      path: "/",
      query: "debug=1",
      normalizedHref: "http://example.com/?debug=1"
    });
  });

  it("rejects unsupported or malformed input", () => {
    expect(isError(normalizeUrl("ftp://example.com"))).toBe(true);
    expect(isError(normalizeUrl("https://user@example.com"))).toBe(true);
    expect(isError(normalizeUrl("https://[::1]/"))).toBe(true);
    expect(isError(normalizeUrl("https://example.com:99999"))).toBe(true);
    expect(isError(normalizeUrl("https://example.com/path#fragment"))).toBe(true);
    expect(isError(normalizeUrl("https://exa mple.com"))).toBe(true);
  });

  it("explains invalid URL input with the first matching reason", () => {
    expect(explainInvalidUrl("https://user@example.com")).toBe(
      "User info is out of scope for this example."
    );
    expect(explainInvalidUrl("https://example.com:99999")).toBe(
      "The port must be an integer between 1 and 65535."
    );
    expect(explainInvalidUrl("http:///path")).toBe("A host is required after the scheme.");
  });

  it("parses query strings into fixed-shape entries", () => {
    expect(parseQueryString("?a=1&flag&empty=&a=2&&")).toEqual([
      { key: "a", value: "1" },
      { key: "flag", value: None },
      { key: "empty", value: "" },
      { key: "a", value: "2" }
    ]);
    expect(parseQueryString("")).toEqual([]);
  });

  it("builds query strings from fixed-shape entries", () => {
    expect(
      buildQueryString([
        { key: "a", value: "1" },
        { key: "flag", value: None },
        { key: "empty", value: "" }
      ])
    ).toBe("a=1&flag&empty=");
    expect(buildQueryString([])).toBe("");
  });
});
