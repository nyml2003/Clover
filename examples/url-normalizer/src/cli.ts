import process from "node:process";
import { performance } from "node:perf_hooks";

import { isError } from "./_clover/protocol.js";
import { matchResult } from "./_clover/std.js";

import { createBenchmarkReport } from "./benchmark.js";
import { explainInvalidUrl, normalizeUrl } from "./index.js";

const command = process.argv[2];

if (command === "--bench") {
  const report = createBenchmarkReport(process.argv[3], () => performance.now());
  for (const line of report.stdoutLines) {
    console.log(line);
  }

  if (report.stderrLine !== null) {
    console.error(report.stderrLine);
    process.exitCode = report.exitCode;
  }
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
