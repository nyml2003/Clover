import process from "node:process";
import { performance } from "node:perf_hooks";

import { isError } from "@clover/protocol";
import { matchResult } from "@clover/std";

import { explainInvalidUrl, normalizeUrl, type NormalizedUrl } from "./index.js";

const DEFAULT_BENCHMARK_ITERATIONS = 200_000;
const DEFAULT_WARMUP_ITERATIONS = 20_000;

const BENCHMARK_INPUTS = [
  "https://Example.com:443/docs?q=1",
  "http://localhost:8080/path/to?a=1&a=2",
  "http://example.com",
  "http://example.com?debug=1",
  "https://api.internal/v1/users?id=42",
  "http://sub.domain.example.org:81/status",
  "https://example.com/a/b/c",
  "http://a-b.example.com:1234/path?q=alpha-beta",
  "https://Example.com:443/a/b/c/d/e/f/g?q=alpha&lang=en&mode=full",
  "http://long-sub-domain.example.org:8081/path/to/resource/with/segments?alpha=1&beta=2&gamma=3",
  "https://api.example.com/v1/users/42/sessions/current?expand=profile,settings,history&lang=en"
] as const;

const command = process.argv[2];

if (command === "--bench") {
  runBenchmark(process.argv[3]);
} else if (typeof command !== "string") {
  console.error('Usage: pnpm run example:url-normalizer -- "https://example.com/path?x=1"');
  console.error("   or: pnpm run example:url-normalizer -- --bench [iterations]");
  process.exitCode = 1;
} else {
  const result = normalizeUrl(command);
  const output = matchResult(
    result,
    (value) => JSON.stringify(value, null, 2),
    () => `Invalid URL: ${explainInvalidUrl(command) ?? "Unsupported input."}`
  );

  if (isError(result)) {
    console.error(output);
    process.exitCode = 1;
  } else {
    console.log(output);
  }
}

function runBenchmark(rawIterations: string | undefined): void {
  const iterations = parseIterations(rawIterations);
  if (iterations === null) {
    console.error("Benchmark iterations must be a positive integer.");
    process.exitCode = 1;
    return;
  }

  console.log(formatBenchmarkConfig(BENCHMARK_INPUTS.length, DEFAULT_WARMUP_ITERATIONS, iterations));

  const comparison = compareImplementations();
  console.log(formatComparisonResult(comparison));
  if (comparison.firstMismatch !== null) {
    console.error(formatMismatch(comparison.firstMismatch));
    process.exitCode = 1;
    return;
  }

  warmup(DEFAULT_WARMUP_ITERATIONS, normalizeWithCustomParser);
  warmup(DEFAULT_WARMUP_ITERATIONS, normalizeWithNodeUrl);

  const custom = benchmark("custom", iterations, normalizeWithCustomParser);
  const node = benchmark("node-url", iterations, normalizeWithNodeUrl);

  console.log(formatBenchmarkResult(custom));
  console.log(formatBenchmarkResult(node));
}

function parseIterations(rawIterations: string | undefined): number | null {
  if (rawIterations === undefined) {
    return DEFAULT_BENCHMARK_ITERATIONS;
  }

  let value = 0;
  for (let index = 0; index < rawIterations.length; index += 1) {
    const code = rawIterations.charCodeAt(index);
    if (code < 0x30 || code > 0x39) {
      return null;
    }

    value = value * 10 + (code - 0x30);
  }

  return value > 0 ? value : null;
}

function warmup(iterations: number, parse: (input: string) => NormalizedUrl): number {
  let checksum = 0;

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    for (const input of BENCHMARK_INPUTS) {
      checksum += parse(input).normalizedHref.length;
    }
  }

  return checksum;
}

function benchmark(
  name: string,
  iterations: number,
  parse: (input: string) => NormalizedUrl
): BenchmarkResult {
  let checksum = 0;
  const start = performance.now();

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    for (const input of BENCHMARK_INPUTS) {
      checksum += parse(input).normalizedHref.length;
    }
  }

  const durationMs = performance.now() - start;
  const operations = iterations * BENCHMARK_INPUTS.length;
  return {
    name,
    iterations,
    operations,
    durationMs,
    opsPerSecond: operations / (durationMs / 1000),
    checksum
  };
}

function normalizeWithCustomParser(input: string): NormalizedUrl {
  const result = normalizeUrl(input);
  if (isError(result)) {
    throw new Error(`Unexpected benchmark failure for custom parser: ${input}`);
  }

  return result;
}

function normalizeWithNodeUrl(input: string): NormalizedUrl {
  const parsed = new URL(input);
  const scheme = parsed.protocol === "https:" ? "https" : "http";
  const port = parsed.port === "" ? null : Number(parsed.port);
  const query = parsed.search === "" ? null : parsed.search.slice(1);

  return {
    scheme,
    host: parsed.hostname,
    port,
    path: parsed.pathname === "" ? "/" : parsed.pathname,
    query,
    normalizedHref: parsed.href
  };
}

function compareImplementations(): ComparisonResult {
  let matches = 0;
  let mismatches = 0;
  let firstMismatch: Mismatch | null = null;

  for (const input of BENCHMARK_INPUTS) {
    const custom = normalizeWithCustomParser(input);
    const node = normalizeWithNodeUrl(input);

    if (isSameNormalizedUrl(custom, node)) {
      matches += 1;
      continue;
    }

    mismatches += 1;
    if (firstMismatch === null) {
      firstMismatch = {
        input,
        custom,
        node
      };
    }
  }

  return {
    matches,
    mismatches,
    firstMismatch
  };
}

function isSameNormalizedUrl(left: NormalizedUrl, right: NormalizedUrl): boolean {
  return (
    left.scheme === right.scheme &&
    left.host === right.host &&
    left.port === right.port &&
    left.path === right.path &&
    left.query === right.query &&
    left.normalizedHref === right.normalizedHref
  );
}

type BenchmarkResult = {
  name: string;
  iterations: number;
  operations: number;
  durationMs: number;
  opsPerSecond: number;
  checksum: number;
};

type ComparisonResult = {
  matches: number;
  mismatches: number;
  firstMismatch: Mismatch | null;
};

type Mismatch = {
  input: string;
  custom: NormalizedUrl;
  node: NormalizedUrl;
};

function formatBenchmarkConfig(
  inputs: number,
  warmupIterations: number,
  iterations: number
): string {
  return [
    "benchmark-config:",
    `inputs=${inputs}`,
    `warmupIterations=${warmupIterations}`,
    `iterations=${iterations}`
  ].join(" ");
}

function formatBenchmarkResult(result: BenchmarkResult): string {
  return [
    `${result.name}:`,
    `iterations=${result.iterations}`,
    `operations=${result.operations}`,
    `durationMs=${result.durationMs.toFixed(2)}`,
    `opsPerSec=${Math.round(result.opsPerSecond)}`,
    `checksum=${result.checksum}`
  ].join(" ");
}

function formatComparisonResult(result: ComparisonResult): string {
  return [
    "equivalence:",
    `inputs=${BENCHMARK_INPUTS.length}`,
    `matches=${result.matches}`,
    `mismatches=${result.mismatches}`
  ].join(" ");
}

function formatMismatch(mismatch: Mismatch): string {
  return [
    "equivalence-mismatch:",
    `input=${JSON.stringify(mismatch.input)}`,
    `custom=${JSON.stringify(mismatch.custom)}`,
    `node-url=${JSON.stringify(mismatch.node)}`
  ].join(" ");
}
