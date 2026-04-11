import {
  None,
  createError,
  isError,
  type CloverError,
  type Option,
  type Result,
  type SmiInt
} from "@clover/protocol";

import { splitOnce } from "../string/index.js";
import { parseSmiInt } from "../number/index.js";

const AT = 0x40;
const COLON = 0x3a;
const DOT = 0x2e;
const HASH = 0x23;
const HYPHEN = 0x2d;
const LEFT_BRACKET = 0x5b;
const QUESTION = 0x3f;
const RIGHT_BRACKET = 0x5d;
const SLASH = 0x2f;
const ZERO = 0x30;
const DEFAULT_PORT_HTTP = 80;
const DEFAULT_PORT_HTTPS = 443;

export const ParseHostPortErrorCode = {
  InvalidHost: 1601,
  InvalidPort: 1602
} as const;

type ParseHostPortErrorCodeValue =
  (typeof ParseHostPortErrorCode)[keyof typeof ParseHostPortErrorCode];

export type ParseHostPortErrorPayload = {
  input: string;
  reason: string;
};

export type ParseHostPortError = CloverError<
  ParseHostPortErrorCodeValue,
  ParseHostPortErrorPayload
>;

export type ParsedHostPort = {
  host: string;
  port: Option<SmiInt>;
};

export type QueryParam = {
  key: string;
  value: Option<string>;
};

export const NormalizeUrlErrorCode = {
  InvalidUrl: 1701
} as const;

export type NormalizeUrlErrorPayload = string;

export type SupportedScheme = "http" | "https";

export type NormalizedUrl = {
  scheme: SupportedScheme;
  host: string;
  port: Option<SmiInt>;
  path: string;
  query: Option<string>;
  normalizedHref: string;
};

type ParsedUrlCore = {
  scheme: SupportedScheme;
  hostStart: number;
  hostEnd: number;
  hostHasUppercase: boolean;
  port: Option<SmiInt>;
  pathStart: number;
  pathEnd: number;
  queryStart: number;
  length: number;
};

const ERR_EMPTY_INPUT = "URL input must be a non-empty string.";
const ERR_ABSOLUTE_URL = "An absolute http:// or https:// URL is required.";
const ERR_SCHEME_ALPHA = "The scheme must use ASCII alphabetic characters only.";
const ERR_SCHEME_UNSUPPORTED = "Only http:// and https:// URLs are supported.";
const ERR_HOST_REQUIRED = "A host is required after the scheme.";
const ERR_HOST_LABEL = "The host must use simple ASCII labels.";
const ERR_USER_INFO = "User info is out of scope for this example.";
const ERR_IPV6 = "IPv6 hosts are out of scope for this example.";
const ERR_FRAGMENT = "Fragments are out of scope for this example.";
const ERR_WHITESPACE = "ASCII whitespace is out of scope for this example.";
const ERR_TRAILING_INPUT = "Unexpected trailing input.";
const ERR_PORT_REQUIRED = "Port digits are required after ':'.";
const ERR_PORT_SIMPLE = "Only simple host:port authorities are supported.";
const ERR_PORT_RANGE = "The port must be an integer between 1 and 65535.";

function createParseHostPortError<ErrorCode extends ParseHostPortErrorCodeValue>(
  code: ErrorCode,
  input: string,
  reason: string
): CloverError<ErrorCode, ParseHostPortErrorPayload> {
  return createError(code, {
    input,
    reason
  });
}

function createNormalizeUrlError(
  error: NormalizeUrlErrorPayload
): CloverError<typeof NormalizeUrlErrorCode.InvalidUrl, NormalizeUrlErrorPayload> {
  return createError(NormalizeUrlErrorCode.InvalidUrl, error);
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

function toLowerAsciiCode(code: number): number {
  return code >= 0x41 && code <= 0x5a ? code + 0x20 : code;
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

export function parseHostPort(
  input: string
): Result<ParsedHostPort, ParseHostPortErrorCodeValue, ParseHostPortErrorPayload> {
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

function parseUrlCore(
  input: string
): Result<ParsedUrlCore, typeof NormalizeUrlErrorCode.InvalidUrl, NormalizeUrlErrorPayload> {
  const length = input.length;
  if (length === 0) {
    return createNormalizeUrlError(ERR_EMPTY_INPUT);
  }

  let state = 0;
  let index = 0;
  let schemeLength = 0;
  let scheme: SupportedScheme | null = null;

  let hostStart = -1;
  let hostEnd = -1;
  let hostHasUppercase = false;
  let labelLength = 0;
  let lastWasHyphen = false;

  let port: Option<SmiInt> = None;
  let portValue = 0;
  let hasPortDigits = false;

  let pathStart = -1;
  let pathEnd = length;
  let queryStart = -1;

  while (index < length) {
    const code = input.charCodeAt(index);

    if (state === 0) {
      if (code === COLON) {
        if (schemeLength === 0) {
          return createNormalizeUrlError(ERR_ABSOLUTE_URL);
        }

        if (
          schemeLength === 4 &&
          toLowerAsciiCode(input.charCodeAt(0)) === 0x68 &&
          toLowerAsciiCode(input.charCodeAt(1)) === 0x74 &&
          toLowerAsciiCode(input.charCodeAt(2)) === 0x74 &&
          toLowerAsciiCode(input.charCodeAt(3)) === 0x70
        ) {
          scheme = "http";
        } else if (
          schemeLength === 5 &&
          toLowerAsciiCode(input.charCodeAt(0)) === 0x68 &&
          toLowerAsciiCode(input.charCodeAt(1)) === 0x74 &&
          toLowerAsciiCode(input.charCodeAt(2)) === 0x74 &&
          toLowerAsciiCode(input.charCodeAt(3)) === 0x70 &&
          toLowerAsciiCode(input.charCodeAt(4)) === 0x73
        ) {
          scheme = "https";
        } else {
          return createNormalizeUrlError(ERR_SCHEME_UNSUPPORTED);
        }

        state = 1;
        index += 1;
        continue;
      }

      if (!((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a))) {
        return createNormalizeUrlError(ERR_SCHEME_ALPHA);
      }

      schemeLength += 1;
      index += 1;
      continue;
    }

    if (state === 1) {
      if (code !== SLASH) {
        return createNormalizeUrlError(ERR_ABSOLUTE_URL);
      }

      state = 2;
      index += 1;
      continue;
    }

    if (state === 2) {
      if (code !== SLASH) {
        return createNormalizeUrlError(ERR_ABSOLUTE_URL);
      }

      hostStart = index + 1;
      state = 3;
      index += 1;
      continue;
    }

    if (state === 3) {
      if (code >= ZERO && code <= 0x39) {
        labelLength += 1;
        lastWasHyphen = false;
        index += 1;
        continue;
      }

      if (code >= 0x41 && code <= 0x5a) {
        hostHasUppercase = true;
        labelLength += 1;
        lastWasHyphen = false;
        index += 1;
        continue;
      }

      if (code >= 0x61 && code <= 0x7a) {
        labelLength += 1;
        lastWasHyphen = false;
        index += 1;
        continue;
      }

      if (code === HYPHEN) {
        if (labelLength === 0) {
          return createNormalizeUrlError(ERR_HOST_LABEL);
        }

        labelLength += 1;
        lastWasHyphen = true;
        index += 1;
        continue;
      }

      if (code === DOT) {
        if (labelLength === 0 || lastWasHyphen) {
          return createNormalizeUrlError(ERR_HOST_LABEL);
        }

        labelLength = 0;
        lastWasHyphen = false;
        index += 1;
        continue;
      }

      if (index === hostStart) {
        if (code === SLASH || code === QUESTION || code === COLON) {
          return createNormalizeUrlError(ERR_HOST_REQUIRED);
        }

        if (code === HASH) {
          return createNormalizeUrlError(ERR_FRAGMENT);
        }

        if (code === LEFT_BRACKET || code === RIGHT_BRACKET) {
          return createNormalizeUrlError(ERR_IPV6);
        }

        if (isAsciiWhitespace(code)) {
          return createNormalizeUrlError(ERR_WHITESPACE);
        }

        return createNormalizeUrlError(ERR_HOST_LABEL);
      }

      if (labelLength === 0 || lastWasHyphen) {
        return createNormalizeUrlError(ERR_HOST_LABEL);
      }

      hostEnd = index;

      if (code === COLON) {
        state = 4;
        portValue = 0;
        hasPortDigits = false;
        index += 1;
        continue;
      }

      if (code === SLASH) {
        state = 5;
        pathStart = index;
        index += 1;
        continue;
      }

      if (code === QUESTION) {
        state = 6;
        queryStart = index + 1;
        index += 1;
        continue;
      }

      if (code === AT) {
        return createNormalizeUrlError(ERR_USER_INFO);
      }

      if (code === LEFT_BRACKET || code === RIGHT_BRACKET) {
        return createNormalizeUrlError(ERR_IPV6);
      }

      if (code === HASH) {
        return createNormalizeUrlError(ERR_FRAGMENT);
      }

      if (isAsciiWhitespace(code)) {
        return createNormalizeUrlError(ERR_WHITESPACE);
      }

      return createNormalizeUrlError(ERR_HOST_LABEL);
    }

    if (state === 4) {
      if (code >= ZERO && code <= 0x39) {
        hasPortDigits = true;
        portValue = portValue * 10 + (code - ZERO);
        if (portValue > 65_535) {
          return createNormalizeUrlError(ERR_PORT_RANGE);
        }

        index += 1;
        continue;
      }

      if (!hasPortDigits) {
        return createNormalizeUrlError(ERR_PORT_REQUIRED);
      }

      if (portValue < 1) {
        return createNormalizeUrlError(ERR_PORT_RANGE);
      }

      port = portValue as SmiInt;

      if (code === COLON) {
        return createNormalizeUrlError(ERR_PORT_SIMPLE);
      }

      if (code === SLASH) {
        state = 5;
        pathStart = index;
        index += 1;
        continue;
      }

      if (code === QUESTION) {
        state = 6;
        queryStart = index + 1;
        index += 1;
        continue;
      }

      if (code === HASH) {
        return createNormalizeUrlError(ERR_FRAGMENT);
      }

      if (isAsciiWhitespace(code)) {
        return createNormalizeUrlError(ERR_WHITESPACE);
      }

      return createNormalizeUrlError(ERR_PORT_RANGE);
    }

    if (state === 5) {
      if (code === QUESTION) {
        pathEnd = index;
        queryStart = index + 1;
        state = 6;
        index += 1;
        continue;
      }

      if (code === HASH) {
        return createNormalizeUrlError(ERR_FRAGMENT);
      }

      if (isAsciiWhitespace(code)) {
        return createNormalizeUrlError(ERR_WHITESPACE);
      }

      index += 1;
      continue;
    }

    if (code === HASH) {
      return createNormalizeUrlError(ERR_FRAGMENT);
    }

    if (isAsciiWhitespace(code)) {
      return createNormalizeUrlError(ERR_WHITESPACE);
    }

    index += 1;
  }

  if (state === 0 || state === 1 || state === 2) {
    return createNormalizeUrlError(ERR_ABSOLUTE_URL);
  }

  if (state === 3) {
    if (hostStart === length) {
      return createNormalizeUrlError(ERR_HOST_REQUIRED);
    }

    if (labelLength === 0 || lastWasHyphen) {
      return createNormalizeUrlError(ERR_HOST_LABEL);
    }

    hostEnd = length;
  } else if (state === 4) {
    if (!hasPortDigits) {
      return createNormalizeUrlError(ERR_PORT_REQUIRED);
    }

    if (portValue < 1) {
      return createNormalizeUrlError(ERR_PORT_RANGE);
    }

    port = portValue as SmiInt;
  } else if (state === 5) {
    pathEnd = length;
  }

  if (scheme === null || hostStart === -1 || hostEnd === -1) {
    return createNormalizeUrlError(ERR_TRAILING_INPUT);
  }

  return {
    scheme,
    hostStart,
    hostEnd,
    hostHasUppercase,
    port,
    pathStart,
    pathEnd,
    queryStart,
    length
  };
}

export function normalizeUrl(
  input: string
): Result<NormalizedUrl, typeof NormalizeUrlErrorCode.InvalidUrl, NormalizeUrlErrorPayload> {
  const parsed = parseUrlCore(input);
  if (isError(parsed)) {
    return parsed;
  }

  const host = parsed.hostHasUppercase
    ? input.substring(parsed.hostStart, parsed.hostEnd).toLowerCase()
    : input.substring(parsed.hostStart, parsed.hostEnd);
  const normalizedPort =
    parsed.scheme === "http"
      ? parsed.port === DEFAULT_PORT_HTTP
        ? None
        : parsed.port
      : parsed.port === DEFAULT_PORT_HTTPS
        ? None
        : parsed.port;
  const path = parsed.pathStart === -1 ? "/" : input.substring(parsed.pathStart, parsed.pathEnd);
  const query = parsed.queryStart === -1 ? None : input.substring(parsed.queryStart, parsed.length);
  const authorityText = normalizedPort === None ? host : `${host}:${normalizedPort}`;
  const normalizedHref =
    query === None
      ? `${parsed.scheme}://${authorityText}${path}`
      : `${parsed.scheme}://${authorityText}${path}?${query}`;

  return {
    scheme: parsed.scheme,
    host,
    port: normalizedPort,
    path,
    query,
    normalizedHref
  };
}

export function explainInvalidUrl(input: string): Option<string> {
  const result = normalizeUrl(input);
  return isError(result) ? result.payload : None;
}

export function parseQueryString(input: string): readonly QueryParam[] {
  const query = input.startsWith("?") ? input.slice(1) : input;
  if (query.length === 0) {
    return [];
  }

  const segments = query.split("&");
  const params: QueryParam[] = [];

  for (const segment of segments) {
    if (segment.length === 0) {
      continue;
    }

    const split = splitOnce(segment, "=");
    if (split === None) {
      params.push({
        key: segment,
        value: None
      });
      continue;
    }

    params.push({
      key: split[0],
      value: split[1]
    });
  }

  return params;
}

export function buildQueryString(params: readonly QueryParam[]): string {
  if (params.length === 0) {
    return "";
  }

  let output = "";
  let isFirst = true;

  for (const param of params) {
    if (!isFirst) {
      output += "&";
    }

    output += param.key;
    if (param.value !== None) {
      output += `=${param.value}`;
    }

    isFirst = false;
  }

  return output;
}
