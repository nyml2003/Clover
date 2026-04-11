import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { isError } from "@clover/protocol";
import { describe, expect, it } from "vitest";

import { explainInvalidUrl, normalizeUrl } from "../src/index.ts";

const cliPath = fileURLToPath(new URL("../dist/cli.js", import.meta.url));

describe("@clover/example-url-normalizer", () => {
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

  it("explains the first invalid condition in plain language", () => {
    expect(explainInvalidUrl("https://user@example.com")).toBe(
      "User info is out of scope for this example."
    );
    expect(explainInvalidUrl("https://example.com:99999")).toBe(
      "The port must be an integer between 1 and 65535."
    );
  });

  it("rejects empty hosts and malformed host labels", () => {
    expect(explainInvalidUrl("http:///path")).toBe("A host is required after the scheme.");
    expect(explainInvalidUrl("http://-bad.example")).toBe("The host must use simple ASCII labels.");
    expect(explainInvalidUrl("http://bad-.example")).toBe("The host must use simple ASCII labels.");
    expect(explainInvalidUrl("http://example..com")).toBe("The host must use simple ASCII labels.");
  });

  it("rejects malformed ports before building the normalized URL", () => {
    expect(explainInvalidUrl("https://example.com:")).toBe("Port digits are required after ':'.");
    expect(explainInvalidUrl("https://example.com:80:90")).toBe(
      "Only simple host:port authorities are supported."
    );
    expect(explainInvalidUrl("https://example.com:0")).toBe(
      "The port must be an integer between 1 and 65535."
    );
  });

  it("prints normalized JSON from the CLI", () => {
    const result = spawnSync(process.execPath, [cliPath, "https://Example.com:443/docs?q=1"], {
      encoding: "utf8"
    });

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      scheme: "https",
      host: "example.com",
      port: null,
      path: "/docs",
      query: "q=1",
      normalizedHref: "https://example.com/docs?q=1"
    });
    expect(result.stderr).toBe("");
  });

  it("returns a non-zero exit code and readable message on invalid input", () => {
    const result = spawnSync(process.execPath, [cliPath, "https://user@example.com"], {
      encoding: "utf8"
    });

    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("Invalid URL: User info is out of scope for this example.");
  });

  it("prints benchmark results for both parsers", () => {
    const result = spawnSync(process.execPath, [cliPath, "--bench", "10"], {
      encoding: "utf8"
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("benchmark-config:");
    expect(result.stdout).toContain("warmupIterations=20000");
    expect(result.stdout).toContain("equivalence:");
    expect(result.stdout).toContain("mismatches=0");
    expect(result.stdout).toContain("custom:");
    expect(result.stdout).toContain("node-url:");
    expect(result.stdout).toContain("iterations=10");
  });
});
