import { createError, type Result } from "@clover/protocol";

export interface NormalizedUrl {
  scheme: SupportedScheme;
  host: string;
  port: number | null;
  path: string;
  query: string | null;
  normalizedHref: string;
}

type SupportedScheme = "http" | "https";
type UrlNormalizeErrorData = string;

type InspectionSuccess = {
  ok: true;
  value: NormalizedUrl;
};

type InspectionFailure = {
  ok: false;
  error: string;
};

type InspectionResult = InspectionSuccess | InspectionFailure;

const COLON = 0x3a;
const SLASH = 0x2f;
const QUESTION = 0x3f;
const HASH = 0x23;
const DOT = 0x2e;
const HYPHEN = 0x2d;
const AT = 0x40;
const LEFT_BRACKET = 0x5b;
const RIGHT_BRACKET = 0x5d;
const ZERO = 0x30;
const NINE = 0x39;
const A_UPPER = 0x41;
const Z_UPPER = 0x5a;
const A_LOWER = 0x61;
const Z_LOWER = 0x7a;
const DEFAULT_PORT_HTTP = 80;
const DEFAULT_PORT_HTTPS = 443;

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
const ERR_PATH_PREFIX = "The path must start with '/' when present.";

const UrlNormalizeErrorCode = 3001;

export function normalizeUrl(input: string): Result<NormalizedUrl, UrlNormalizeErrorData> {
  const parsed = parseUrl(input);
  return parsed.ok ? parsed.value : createError(UrlNormalizeErrorCode, parsed.error);
}

export function explainInvalidUrl(input: string): string | null {
  const parsed = parseUrl(input);
  return parsed.ok ? null : parsed.error;
}

function parseUrl(input: string): InspectionResult {
  const length = input.length;
  if (length === 0) {
    return fail(ERR_EMPTY_INPUT);
  }

  let index = 0;

  while (index < length) {
    const code = input.charCodeAt(index);
    if (code === COLON) {
      break;
    }

    if (!isAsciiAlphaCode(code)) {
      return fail(ERR_SCHEME_ALPHA);
    }

    index += 1;
  }

  const schemeEnd = index;
  if (schemeEnd === 0 || schemeEnd === length) {
    return fail(ERR_ABSOLUTE_URL);
  }

  if (
    schemeEnd + 2 >= length ||
    input.charCodeAt(schemeEnd + 1) !== SLASH ||
    input.charCodeAt(schemeEnd + 2) !== SLASH
  ) {
    return fail(ERR_ABSOLUTE_URL);
  }

  let scheme: SupportedScheme;
  if (matchesHttpScheme(input, schemeEnd)) {
    scheme = "http";
  } else if (matchesHttpsScheme(input, schemeEnd)) {
    scheme = "https";
  } else {
    return fail(ERR_SCHEME_UNSUPPORTED);
  }

  index = schemeEnd + 3;
  if (index >= length) {
    return fail(ERR_HOST_REQUIRED);
  }

  const hostStart = index;
  let labelLength = 0;
  let lastWasHyphen = false;
  let hostHasUppercase = false;

  while (index < length) {
    const code = input.charCodeAt(index);

    if (isAsciiDigitCode(code)) {
      labelLength += 1;
      lastWasHyphen = false;
      index += 1;
      continue;
    }

    if (isAsciiAlphaCode(code)) {
      if (isAsciiUpperCode(code)) {
        hostHasUppercase = true;
      }

      labelLength += 1;
      lastWasHyphen = false;
      index += 1;
      continue;
    }

    if (code === HYPHEN) {
      if (labelLength === 0) {
        return fail(ERR_HOST_LABEL);
      }

      labelLength += 1;
      lastWasHyphen = true;
      index += 1;
      continue;
    }

    if (code === DOT) {
      if (labelLength === 0 || lastWasHyphen) {
        return fail(ERR_HOST_LABEL);
      }

      labelLength = 0;
      lastWasHyphen = false;
      index += 1;
      continue;
    }

    break;
  }

  if (index === hostStart) {
    return failForMissingHost(input, index, length);
  }

  if (labelLength === 0 || lastWasHyphen) {
    return fail(ERR_HOST_LABEL);
  }

  const hostEnd = index;
  const host = hostHasUppercase
    ? input.slice(hostStart, hostEnd).toLowerCase()
    : input.slice(hostStart, hostEnd);

  let port: number | null = null;
  if (index < length) {
    const code = input.charCodeAt(index);

    if (code === COLON) {
      index += 1;
      if (index >= length) {
        return fail(ERR_PORT_REQUIRED);
      }

      let portValue = 0;
      let hasDigit = false;

      while (index < length) {
        const digitCode = input.charCodeAt(index);
        if (!isAsciiDigitCode(digitCode)) {
          break;
        }

        hasDigit = true;
        portValue = portValue * 10 + (digitCode - ZERO);
        if (portValue > 65_535) {
          return fail(ERR_PORT_RANGE);
        }

        index += 1;
      }

      if (!hasDigit) {
        return fail(ERR_PORT_REQUIRED);
      }

      if (portValue < 1) {
        return fail(ERR_PORT_RANGE);
      }

      if (index < length) {
        const portTerminator = input.charCodeAt(index);
        if (portTerminator === COLON) {
          return fail(ERR_PORT_SIMPLE);
        }

        if (portTerminator === HASH) {
          return fail(ERR_FRAGMENT);
        }

        if (isAsciiWhitespaceCode(portTerminator)) {
          return fail(ERR_WHITESPACE);
        }

        if (portTerminator !== SLASH && portTerminator !== QUESTION) {
          return fail(ERR_PORT_RANGE);
        }
      }

      port = portValue;
    } else if (code === AT) {
      return fail(ERR_USER_INFO);
    } else if (code === LEFT_BRACKET || code === RIGHT_BRACKET) {
      return fail(ERR_IPV6);
    } else if (code === HASH) {
      return fail(ERR_FRAGMENT);
    } else if (isAsciiWhitespaceCode(code)) {
      return fail(ERR_WHITESPACE);
    } else if (code !== SLASH && code !== QUESTION) {
      return fail(ERR_HOST_LABEL);
    }
  }

  let path = "/";
  let query: string | null = null;

  if (index < length) {
    const code = input.charCodeAt(index);

    if (code === QUESTION) {
      const queryStart = index + 1;
      index = queryStart;
      while (index < length) {
        const queryCode = input.charCodeAt(index);
        if (queryCode === HASH) {
          return fail(ERR_FRAGMENT);
        }

        if (isAsciiWhitespaceCode(queryCode)) {
          return fail(ERR_WHITESPACE);
        }

        index += 1;
      }

      query = input.slice(queryStart, index);
    } else if (code === SLASH) {
      const pathStart = index;
      index += 1;

      while (index < length) {
        const pathCode = input.charCodeAt(index);
        if (pathCode === QUESTION) {
          break;
        }

        if (pathCode === HASH) {
          return fail(ERR_FRAGMENT);
        }

        if (isAsciiWhitespaceCode(pathCode)) {
          return fail(ERR_WHITESPACE);
        }

        index += 1;
      }

      path = input.slice(pathStart, index);

      if (index < length) {
        const queryStart = index + 1;
        index = queryStart;

        while (index < length) {
          const queryCode = input.charCodeAt(index);
          if (queryCode === HASH) {
            return fail(ERR_FRAGMENT);
          }

          if (isAsciiWhitespaceCode(queryCode)) {
            return fail(ERR_WHITESPACE);
          }

          index += 1;
        }

        query = input.slice(queryStart, index);
      }
    } else if (code === HASH) {
      return fail(ERR_FRAGMENT);
    } else if (isAsciiWhitespaceCode(code)) {
      return fail(ERR_WHITESPACE);
    } else {
      return fail(ERR_PATH_PREFIX);
    }
  }

  if (index !== length) {
    return fail(ERR_TRAILING_INPUT);
  }

  const normalizedPort =
    scheme === "http"
      ? port === DEFAULT_PORT_HTTP
        ? null
        : port
      : port === DEFAULT_PORT_HTTPS
        ? null
        : port;
  const authorityText = normalizedPort === null ? host : `${host}:${normalizedPort}`;
  const normalizedHref =
    query === null
      ? `${scheme}://${authorityText}${path}`
      : `${scheme}://${authorityText}${path}?${query}`;

  return {
    ok: true,
    value: {
      scheme,
      host,
      port: normalizedPort,
      path,
      query,
      normalizedHref
    }
  };
}

function failForMissingHost(input: string, index: number, length: number): InspectionFailure {
  if (index >= length) {
    return fail(ERR_HOST_REQUIRED);
  }

  const code = input.charCodeAt(index);
  if (code === SLASH || code === QUESTION || code === COLON) {
    return fail(ERR_HOST_REQUIRED);
  }

  if (code === HASH) {
    return fail(ERR_FRAGMENT);
  }

  if (code === LEFT_BRACKET || code === RIGHT_BRACKET) {
    return fail(ERR_IPV6);
  }

  if (isAsciiWhitespaceCode(code)) {
    return fail(ERR_WHITESPACE);
  }

  return fail(ERR_HOST_LABEL);
}

function matchesHttpScheme(input: string, schemeEnd: number): boolean {
  return (
    schemeEnd === 4 &&
    toLowerAsciiCode(input.charCodeAt(0)) === 0x68 &&
    toLowerAsciiCode(input.charCodeAt(1)) === 0x74 &&
    toLowerAsciiCode(input.charCodeAt(2)) === 0x74 &&
    toLowerAsciiCode(input.charCodeAt(3)) === 0x70
  );
}

function matchesHttpsScheme(input: string, schemeEnd: number): boolean {
  return (
    schemeEnd === 5 &&
    toLowerAsciiCode(input.charCodeAt(0)) === 0x68 &&
    toLowerAsciiCode(input.charCodeAt(1)) === 0x74 &&
    toLowerAsciiCode(input.charCodeAt(2)) === 0x74 &&
    toLowerAsciiCode(input.charCodeAt(3)) === 0x70 &&
    toLowerAsciiCode(input.charCodeAt(4)) === 0x73
  );
}

function toLowerAsciiCode(code: number): number {
  return code >= A_UPPER && code <= Z_UPPER ? code + 0x20 : code;
}

function isAsciiAlphaCode(code: number): boolean {
  return (code >= A_UPPER && code <= Z_UPPER) || (code >= A_LOWER && code <= Z_LOWER);
}

function isAsciiUpperCode(code: number): boolean {
  return code >= A_UPPER && code <= Z_UPPER;
}

function isAsciiDigitCode(code: number): boolean {
  return code >= ZERO && code <= NINE;
}

function isAsciiWhitespaceCode(code: number): boolean {
  return code === 0x20 || (code >= 0x09 && code <= 0x0d);
}

function fail(error: string): InspectionFailure {
  return {
    ok: false,
    error
  };
}
