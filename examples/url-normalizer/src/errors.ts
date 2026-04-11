import { createError, type CloverError } from "@clover/protocol";

export type UrlNormalizeErrorData = string;

export const UrlNormalizeErrorCode = 3001;

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
export const ERR_PATH_PREFIX = "The path must start with '/' when present.";

export function createUrlNormalizeError(error: UrlNormalizeErrorData): CloverError<UrlNormalizeErrorData> {
  return createError(UrlNormalizeErrorCode, error);
}
