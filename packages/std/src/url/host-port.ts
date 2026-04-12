import { None, createError, isError, type CloverError } from "@clover.js/protocol";

import { parseSmiInt } from "../number/index.js";
import {
  COLON,
  DOT,
  HYPHEN,
  ParseHostPortErrorCode,
  type ParseHostPortErrorPayload,
  type ParseHostPortResult,
  ZERO
} from "./shared.js";

function createParseHostPortError<
  ErrorCode extends (typeof ParseHostPortErrorCode)[keyof typeof ParseHostPortErrorCode]
>(
  code: ErrorCode,
  input: string,
  reason: string
): CloverError<ErrorCode, ParseHostPortErrorPayload> {
  return createError(code, {
    input,
    reason
  });
}

function isAsciiHostLabelChar(code: number): boolean {
  return (
    (code >= ZERO && code <= 0x39) ||
    (code >= 0x41 && code <= 0x5a) ||
    (code >= 0x61 && code <= 0x7a)
  );
}

function isAsciiWhitespace(code: number): boolean {
  return code === 0x20 || (code >= 0x09 && code <= 0x0d);
}

function validateHost(input: string, hostEndExclusive: number): string | null {
  if (hostEndExclusive === 0) {
    return "empty-host";
  }

  let labelLength = 0;
  let lastWasHyphen = false;

  for (let index = 0; index < hostEndExclusive; index += 1) {
    const code = input.charCodeAt(index);

    if (isAsciiHostLabelChar(code)) {
      labelLength += 1;
      lastWasHyphen = false;
      continue;
    }

    if (code === HYPHEN) {
      if (labelLength === 0) {
        return "invalid-host-label";
      }

      labelLength += 1;
      lastWasHyphen = true;
      continue;
    }

    if (code === DOT) {
      if (labelLength === 0 || lastWasHyphen) {
        return "invalid-host-label";
      }

      labelLength = 0;
      lastWasHyphen = false;
      continue;
    }

    if (isAsciiWhitespace(code)) {
      return "whitespace";
    }

    if (code === 0x40) {
      return "user-info";
    }

    if (code === 0x5b || code === 0x5d) {
      return "ipv6";
    }

    return "invalid-host-char";
  }

  if (labelLength === 0 || lastWasHyphen) {
    return "invalid-host-label";
  }

  return null;
}

export function parseHostPort(input: string): ParseHostPortResult {
  if (input.length === 0) {
    return createParseHostPortError(ParseHostPortErrorCode.InvalidHost, input, "empty-host");
  }

  let colonIndex = -1;

  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);

    if (isAsciiWhitespace(code)) {
      return createParseHostPortError(ParseHostPortErrorCode.InvalidHost, input, "whitespace");
    }

    if (code === 0x40) {
      return createParseHostPortError(ParseHostPortErrorCode.InvalidHost, input, "user-info");
    }

    if (code === 0x5b || code === 0x5d) {
      return createParseHostPortError(ParseHostPortErrorCode.InvalidHost, input, "ipv6");
    }

    if (code === COLON) {
      if (colonIndex !== -1) {
        return createParseHostPortError(
          ParseHostPortErrorCode.InvalidPort,
          input,
          "invalid-port-separator"
        );
      }

      colonIndex = index;
    }
  }

  const hostEndExclusive = colonIndex === -1 ? input.length : colonIndex;
  const hostReason = validateHost(input, hostEndExclusive);
  if (hostReason !== null) {
    return createParseHostPortError(ParseHostPortErrorCode.InvalidHost, input, hostReason);
  }

  const host = input.slice(0, hostEndExclusive);
  if (colonIndex === -1) {
    return {
      host,
      port: None
    };
  }

  const rawPort = input.slice(colonIndex + 1);
  if (rawPort.length === 0) {
    return createParseHostPortError(ParseHostPortErrorCode.InvalidPort, input, "missing-port");
  }

  const port = parseSmiInt(rawPort);
  if (isError(port)) {
    return createParseHostPortError(ParseHostPortErrorCode.InvalidPort, input, port.payload.reason);
  }

  if (port < 1 || port > 65_535) {
    return createParseHostPortError(ParseHostPortErrorCode.InvalidPort, input, "out-of-range");
  }

  return {
    host,
    port
  };
}
