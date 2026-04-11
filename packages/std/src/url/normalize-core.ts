import { None, createError, type CloverError, type Option, type SmiInt } from "@clover/protocol";

import {
  AT,
  COLON,
  DOT,
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
  HASH,
  HYPHEN,
  LEFT_BRACKET,
  NormalizeUrlErrorCode,
  type NormalizeUrlErrorPayload,
  type ParsedUrlCore,
  QUESTION,
  RIGHT_BRACKET,
  SLASH,
  type SupportedScheme,
  ZERO
} from "./shared.js";

function createNormalizeUrlError(
  error: NormalizeUrlErrorPayload
): CloverError<typeof NormalizeUrlErrorCode.InvalidUrl, NormalizeUrlErrorPayload> {
  return createError(NormalizeUrlErrorCode.InvalidUrl, error);
}

function isAsciiWhitespace(code: number): boolean {
  return code === 0x20 || (code >= 0x09 && code <= 0x0d);
}

function toLowerAsciiCode(code: number): number {
  return code >= 0x41 && code <= 0x5a ? code + 0x20 : code;
}

export function parseUrlCore(
  input: string
): ParsedUrlCore | CloverError<typeof NormalizeUrlErrorCode.InvalidUrl, NormalizeUrlErrorPayload> {
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
