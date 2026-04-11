import type { Result } from "@clover/protocol";

import {
  createUrlNormalizeError,
  ERR_ABSOLUTE_URL,
  ERR_EMPTY_INPUT,
  ERR_FRAGMENT,
  ERR_HOST_LABEL,
  ERR_HOST_REQUIRED,
  ERR_IPV6,
  ERR_PORT_RANGE,
  ERR_PORT_REQUIRED,
  ERR_PORT_SIMPLE,
  ERR_SCHEME_ALPHA,
  ERR_SCHEME_UNSUPPORTED,
  ERR_TRAILING_INPUT,
  ERR_USER_INFO,
  ERR_WHITESPACE,
  type UrlNormalizeErrorData
} from "./errors.js";
import {
  AT,
  COLON,
  DOT,
  HASH,
  HYPHEN,
  LEFT_BRACKET,
  QUESTION,
  RIGHT_BRACKET,
  SLASH,
  ZERO
} from "./parser-utils.js";
import type { SupportedScheme } from "./types.js";

const STATE_SCHEME = 0;
const STATE_SCHEME_SLASH_1 = 1;
const STATE_SCHEME_SLASH_2 = 2;
const STATE_HOST = 3;
const STATE_PORT = 4;
const STATE_PATH = 5;
const STATE_QUERY = 6;

export type ParsedUrlCore = {
  scheme: SupportedScheme;
  hostStart: number;
  hostEnd: number;
  hostHasUppercase: boolean;
  port: number | null;
  pathStart: number;
  pathEnd: number;
  queryStart: number;
  length: number;
};

export function parseUrlCore(input: string): Result<ParsedUrlCore, UrlNormalizeErrorData> {
  const length = input.length;
  if (length === 0) {
    return fail(ERR_EMPTY_INPUT);
  }

  let state = STATE_SCHEME;
  let index = 0;
  let schemeLength = 0;
  let scheme: SupportedScheme | null = null;

  let hostStart = -1;
  let hostEnd = -1;
  let hostHasUppercase = false;
  let labelLength = 0;
  let lastWasHyphen = false;

  let port: number | null = null;
  let portValue = 0;
  let hasPortDigits = false;

  let pathStart = -1;
  let pathEnd = length;
  let queryStart = -1;

  while (index < length) {
    const code = input.charCodeAt(index);

    if (state === STATE_SCHEME) {
      if (code === COLON) {
        if (schemeLength === 0) {
          return fail(ERR_ABSOLUTE_URL);
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
          return fail(ERR_SCHEME_UNSUPPORTED);
        }

        state = STATE_SCHEME_SLASH_1;
        index += 1;
        continue;
      }

      if (!((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a))) {
        return fail(ERR_SCHEME_ALPHA);
      }

      schemeLength += 1;
      index += 1;
      continue;
    }

    if (state === STATE_SCHEME_SLASH_1) {
      if (code !== SLASH) {
        return fail(ERR_ABSOLUTE_URL);
      }

      state = STATE_SCHEME_SLASH_2;
      index += 1;
      continue;
    }

    if (state === STATE_SCHEME_SLASH_2) {
      if (code !== SLASH) {
        return fail(ERR_ABSOLUTE_URL);
      }

      hostStart = index + 1;
      state = STATE_HOST;
      index += 1;
      continue;
    }

    if (state === STATE_HOST) {
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

      if (index === hostStart) {
        if (code === SLASH || code === QUESTION || code === COLON) {
          return fail(ERR_HOST_REQUIRED);
        }

        if (code === HASH) {
          return fail(ERR_FRAGMENT);
        }

        if (code === LEFT_BRACKET || code === RIGHT_BRACKET) {
          return fail(ERR_IPV6);
        }

        if (code === 0x20 || (code >= 0x09 && code <= 0x0d)) {
          return fail(ERR_WHITESPACE);
        }

        return fail(ERR_HOST_LABEL);
      }

      if (labelLength === 0 || lastWasHyphen) {
        return fail(ERR_HOST_LABEL);
      }

      hostEnd = index;

      if (code === COLON) {
        state = STATE_PORT;
        portValue = 0;
        hasPortDigits = false;
        index += 1;
        continue;
      }

      if (code === SLASH) {
        state = STATE_PATH;
        pathStart = index;
        index += 1;
        continue;
      }

      if (code === QUESTION) {
        state = STATE_QUERY;
        queryStart = index + 1;
        index += 1;
        continue;
      }

      if (code === AT) {
        return fail(ERR_USER_INFO);
      }

      if (code === LEFT_BRACKET || code === RIGHT_BRACKET) {
        return fail(ERR_IPV6);
      }

      if (code === HASH) {
        return fail(ERR_FRAGMENT);
      }

      if (code === 0x20 || (code >= 0x09 && code <= 0x0d)) {
        return fail(ERR_WHITESPACE);
      }

      return fail(ERR_HOST_LABEL);
    }

    if (state === STATE_PORT) {
      if (code >= ZERO && code <= 0x39) {
        hasPortDigits = true;
        portValue = portValue * 10 + (code - ZERO);
        if (portValue > 65_535) {
          return fail(ERR_PORT_RANGE);
        }

        index += 1;
        continue;
      }

      if (!hasPortDigits) {
        return fail(ERR_PORT_REQUIRED);
      }

      if (portValue < 1) {
        return fail(ERR_PORT_RANGE);
      }

      port = portValue;

      if (code === COLON) {
        return fail(ERR_PORT_SIMPLE);
      }

      if (code === SLASH) {
        state = STATE_PATH;
        pathStart = index;
        index += 1;
        continue;
      }

      if (code === QUESTION) {
        state = STATE_QUERY;
        queryStart = index + 1;
        index += 1;
        continue;
      }

      if (code === HASH) {
        return fail(ERR_FRAGMENT);
      }

      if (code === 0x20 || (code >= 0x09 && code <= 0x0d)) {
        return fail(ERR_WHITESPACE);
      }

      return fail(ERR_PORT_RANGE);
    }

    if (state === STATE_PATH) {
      if (code === QUESTION) {
        pathEnd = index;
        queryStart = index + 1;
        state = STATE_QUERY;
        index += 1;
        continue;
      }

      if (code === HASH) {
        return fail(ERR_FRAGMENT);
      }

      if (code === 0x20 || (code >= 0x09 && code <= 0x0d)) {
        return fail(ERR_WHITESPACE);
      }

      index += 1;
      continue;
    }

    if (code === HASH) {
      return fail(ERR_FRAGMENT);
    }

    if (code === 0x20 || (code >= 0x09 && code <= 0x0d)) {
      return fail(ERR_WHITESPACE);
    }

    index += 1;
  }

  if (state === STATE_SCHEME || state === STATE_SCHEME_SLASH_1 || state === STATE_SCHEME_SLASH_2) {
    return fail(ERR_ABSOLUTE_URL);
  }

  if (state === STATE_HOST) {
    if (hostStart === length) {
      return fail(ERR_HOST_REQUIRED);
    }

    if (labelLength === 0 || lastWasHyphen) {
      return fail(ERR_HOST_LABEL);
    }

    hostEnd = length;
  } else if (state === STATE_PORT) {
    if (!hasPortDigits) {
      return fail(ERR_PORT_REQUIRED);
    }

    if (portValue < 1) {
      return fail(ERR_PORT_RANGE);
    }

    port = portValue;
  } else if (state === STATE_PATH) {
    pathEnd = length;
  }

  if (scheme === null || hostStart === -1 || hostEnd === -1) {
    return fail(ERR_TRAILING_INPUT);
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

function toLowerAsciiCode(code: number): number {
  return code >= 0x41 && code <= 0x5a ? code + 0x20 : code;
}

function fail(error: UrlNormalizeErrorData): Result<never, UrlNormalizeErrorData> {
  return createUrlNormalizeError(error);
}
