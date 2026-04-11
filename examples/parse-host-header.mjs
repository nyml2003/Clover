import { None, createError, isError, isNone } from "../packages/protocol/dist/index.js";
import {
  NumberErrorCode,
  inRange,
  matchResult,
  parseSmiInt,
  splitOnce
} from "../packages/std/dist/index.js";

const ExampleErrorCode = {
  InvalidHeaderLine: 9001,
  InvalidHostHeader: 9002,
  InvalidHostPort: 9003
} as const;

function parseHostHeader(line) {
  const nameAndValue = splitOnce(line, ": ");
  if (nameAndValue === None) {
    return createError(ExampleErrorCode.InvalidHeaderLine, {
      line,
      reason: "missing-separator"
    });
  }

  const [rawName, rawValue] = nameAndValue;
  const headerName = rawName.toLowerCase();
  if (headerName !== "host") {
    return createError(ExampleErrorCode.InvalidHostHeader, {
      line,
      reason: "unexpected-header"
    });
  }

  const hostAndPort = splitOnce(rawValue, ":");
  if (hostAndPort === None) {
    return {
      name: headerName,
      host: rawValue,
      port: None
    };
  }

  const [host, rawPort] = hostAndPort;
  const port = parseSmiInt(rawPort);

  if (isError(port)) {
    return createError(ExampleErrorCode.InvalidHostPort, {
      line,
      reason: port.payload.reason
    });
  }

  if (!inRange(port, 1, 65_535)) {
    return createError(ExampleErrorCode.InvalidHostPort, {
      line,
      reason: "out-of-range"
    });
  }

  return {
    name: headerName,
    host,
    port
  };
}

function printHostHeader(line) {
  const parsed = parseHostHeader(line);

  return matchResult(
    parsed,
    (value) =>
      isNone(value.port)
        ? `[ok] ${value.name} -> host=${value.host}, port=None`
        : `[ok] ${value.name} -> host=${value.host}, port=${value.port}`,
    (error) =>
      `[err] code=${error.__code__} invalid host header: ${line} payload=${JSON.stringify(error.payload)}`
  );
}

const lines = [
  "Host: localhost:8080",
  "Host: api.internal",
  "Host: localhost:99999",
  `Host: localhost:${NumberErrorCode.InvalidSmiInt}x`,
  "Content-Type: text/plain",
  "bad header"
];

for (const line of lines) {
  console.log(printHostHeader(line));
}
