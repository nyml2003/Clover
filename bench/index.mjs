import { Bench } from "tinybench";
import { z } from "zod";

import { None, createError, isError, isNone } from "../packages/protocol/dist/index.js";
import { normalizeUrl, parseHostPort, parseSmiInt, splitOnce } from "../packages/std/dist/index.js";
import { parseWith } from "../packages/zod/dist/index.js";

const BranchErrorCode = {
  InvalidBranch: 7001
};

const argvSchema = z.tuple([z.literal("--port"), z.string()]);
const branchError = createError(BranchErrorCode.InvalidBranch, {
  reason: "invalid-branch",
  input: "bad"
});
const URL_BENCHMARK_INPUTS = [
  "example.com",
  "localhost:8080",
  "api.internal:443",
  "sub.domain.example.org:81",
  "a-b.example.com:1234",
  "service.gateway.internal",
  "cache.internal:6379",
  "db01.example.net:5432"
];
const NORMALIZED_URL_BENCHMARK_INPUTS = [
  "https://Example.com:443/docs?q=1",
  "http://localhost:8080/path/to?a=1&a=2",
  "http://example.com",
  "http://example.com?debug=1",
  "https://api.internal/v1/users?id=42",
  "http://sub.domain.example.org:81/status",
  "https://example.com/a/b/c",
  "http://a-b.example.com:1234/path?q=alpha-beta"
];

async function runSection(title, entries) {
  const bench = new Bench({
    time: 100
  });

  for (const [name, fn] of entries) {
    bench.add(name, fn);
  }

  await bench.warmup();
  await bench.run();

  console.log(`\n${title}`);

  for (const task of bench.tasks) {
    if (!task.result) {
      continue;
    }

    console.log(
      `- ${task.name}: hz=${task.result.hz.toFixed(0)}, mean=${task.result.mean.toFixed(5)}, samples=${task.result.samples.length}`
    );
  }
}

function parseWithStdUrl(input) {
  const result = parseHostPort(input);
  if (isError(result)) {
    throw new Error(`Unexpected benchmark failure for std parseHostPort: ${input}`);
  }

  return result;
}

function parseWithNodeUrl(input) {
  const parsed = new URL(`http://${input}/`);

  return {
    host: parsed.hostname,
    port: parsed.port === "" ? None : Number(parsed.port)
  };
}

function normalizeWithStdUrl(input) {
  const result = normalizeUrl(input);
  if (isError(result)) {
    throw new Error(`Unexpected benchmark failure for std normalizeUrl: ${input}`);
  }

  return result;
}

function normalizeWithNodeUrl(input) {
  const parsed = new URL(input);
  const scheme = parsed.protocol === "https:" ? "https" : "http";
  const port = parsed.port === "" ? None : Number(parsed.port);
  const query = parsed.search === "" ? None : parsed.search.substring(1);

  return {
    scheme,
    host: parsed.hostname,
    port,
    path: parsed.pathname === "" ? "/" : parsed.pathname,
    query,
    normalizedHref: parsed.href
  };
}

function compareUrlImplementations() {
  const mismatches = [];

  for (const input of URL_BENCHMARK_INPUTS) {
    const stdResult = parseWithStdUrl(input);
    const nodeResult = parseWithNodeUrl(input);

    if (stdResult.host !== nodeResult.host || stdResult.port !== nodeResult.port) {
      mismatches.push({
        input,
        stdResult,
        nodeResult
      });
    }
  }

  return {
    inputs: URL_BENCHMARK_INPUTS.length,
    matches: URL_BENCHMARK_INPUTS.length - mismatches.length,
    mismatches
  };
}

function benchmarkUrl(parse) {
  let checksum = 0;

  for (const input of URL_BENCHMARK_INPUTS) {
    const result = parse(input);
    checksum += result.host.length;
    checksum += result.port === None ? 0 : result.port;
  }

  return checksum;
}

function compareNormalizedUrlImplementations() {
  const mismatches = [];

  for (const input of NORMALIZED_URL_BENCHMARK_INPUTS) {
    const stdResult = normalizeWithStdUrl(input);
    const nodeResult = normalizeWithNodeUrl(input);

    if (
      stdResult.scheme !== nodeResult.scheme ||
      stdResult.host !== nodeResult.host ||
      stdResult.port !== nodeResult.port ||
      stdResult.path !== nodeResult.path ||
      stdResult.query !== nodeResult.query ||
      stdResult.normalizedHref !== nodeResult.normalizedHref
    ) {
      mismatches.push({
        input,
        stdResult,
        nodeResult
      });
    }
  }

  return {
    inputs: NORMALIZED_URL_BENCHMARK_INPUTS.length,
    matches: NORMALIZED_URL_BENCHMARK_INPUTS.length - mismatches.length,
    mismatches
  };
}

function benchmarkNormalizedUrl(parse) {
  let checksum = 0;

  for (const input of NORMALIZED_URL_BENCHMARK_INPUTS) {
    const result = parse(input);
    checksum += result.normalizedHref.length;
  }

  return checksum;
}

await runSection("string", [
  ["splitOnce:hit", () => splitOnce("host:8080", ":")],
  ["splitOnce:miss", () => splitOnce("localhost", ":")]
]);

await runSection("number", [
  ["parseSmiInt:valid", () => parseSmiInt("2147483647")],
  ["parseSmiInt:invalid", () => parseSmiInt("2147483648")]
]);

await runSection("branch", [
  ["isNone", () => isNone(None)],
  ["isError", () => isError(branchError)]
]);

await runSection("boundary", [
  ["parseWith:valid", () => parseWith(argvSchema, ["--port", "8080"])],
  ["parseWith:invalid", () => parseWith(argvSchema, ["--port", 8080])]
]);

const urlComparison = compareUrlImplementations();

console.log(
  `\nurl-equivalence: inputs=${urlComparison.inputs} matches=${urlComparison.matches} mismatches=${urlComparison.mismatches.length}`
);

if (urlComparison.mismatches.length > 0) {
  throw new Error(`Unexpected std/node url benchmark mismatch: ${JSON.stringify(urlComparison.mismatches[0])}`);
}

await runSection("url", [
  ["parseHostPort:std", () => benchmarkUrl(parseWithStdUrl)],
  ["parseHostPort:node-url", () => benchmarkUrl(parseWithNodeUrl)]
]);

const normalizedUrlComparison = compareNormalizedUrlImplementations();

console.log(
  `\nurl-normalize-equivalence: inputs=${normalizedUrlComparison.inputs} matches=${normalizedUrlComparison.matches} mismatches=${normalizedUrlComparison.mismatches.length}`
);

if (normalizedUrlComparison.mismatches.length > 0) {
  throw new Error(
    `Unexpected std/node normalizeUrl benchmark mismatch: ${JSON.stringify(normalizedUrlComparison.mismatches[0])}`
  );
}

await runSection("url-normalize", [
  ["normalizeUrl:std", () => benchmarkNormalizedUrl(normalizeWithStdUrl)],
  ["normalizeUrl:node-url", () => benchmarkNormalizedUrl(normalizeWithNodeUrl)]
]);
