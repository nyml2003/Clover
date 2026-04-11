import type { CloverError, Option, Result, SmiInt } from "@clover/protocol";

import type { ParsedPath } from "../path/index.js";
import type { QueryParam } from "../query/index.js";

export const AT = 0x40;
export const COLON = 0x3a;
export const DOT = 0x2e;
export const HASH = 0x23;
export const HYPHEN = 0x2d;
export const LEFT_BRACKET = 0x5b;
export const QUESTION = 0x3f;
export const RIGHT_BRACKET = 0x5d;
export const SLASH = 0x2f;
export const ZERO = 0x30;
export const DEFAULT_PORT_HTTP = 80;
export const DEFAULT_PORT_HTTPS = 443;

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

export type ParsedUrlParts = {
  normalized: NormalizedUrl;
  path: ParsedPath;
  queryParams: readonly QueryParam[];
};

export type ParsedUrlCore = {
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

export type ParseHostPortResult = Result<
  ParsedHostPort,
  ParseHostPortErrorCodeValue,
  ParseHostPortErrorPayload
>;

export type NormalizeUrlResult = Result<
  NormalizedUrl,
  typeof NormalizeUrlErrorCode.InvalidUrl,
  NormalizeUrlErrorPayload
>;

export const ERR_EMPTY_INPUT = "URL input must be a non-empty string.";
export const ERR_ABSOLUTE_URL = "An absolute http:// or https:// URL is required.";
export const ERR_SCHEME_ALPHA = "The scheme must use ASCII alphabetic characters only.";
export const ERR_SCHEME_UNSUPPORTED = "Only http:// and https:// URLs are supported.";
export const ERR_HOST_REQUIRED = "A host is required after the scheme.";
export const ERR_HOST_LABEL = "The host must use simple ASCII labels.";
export const ERR_USER_INFO = "User info is out of scope for this example.";
export const ERR_IPV6 = "IPv6 hosts are out of scope for this example.";
export const ERR_FRAGMENT = "Fragments are out of scope for this example.";
export const ERR_WHITESPACE = "ASCII whitespace is out of scope for this example.";
export const ERR_TRAILING_INPUT = "Unexpected trailing input.";
export const ERR_PORT_REQUIRED = "Port digits are required after ':'.";
export const ERR_PORT_SIMPLE = "Only simple host:port authorities are supported.";
export const ERR_PORT_RANGE = "The port must be an integer between 1 and 65535.";
