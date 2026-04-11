import { isError, type Result } from "./_clover/protocol.js";

import { UrlNormalizeErrorCode, type UrlNormalizeErrorPayload } from "./errors.js";
import { DEFAULT_PORT_HTTP, DEFAULT_PORT_HTTPS } from "./parser-utils.js";
import { parseUrlCore, type ParsedUrlCore } from "./parser-core.js";
import type { NormalizedUrl } from "./types.js";

export function normalizeUrl(
  input: string
): Result<NormalizedUrl, typeof UrlNormalizeErrorCode.InvalidUrl, UrlNormalizeErrorPayload> {
  const parsed = parseUrlCore(input);
  return isError(parsed) ? parsed : finalizeParsedUrl(input, parsed);
}

export function explainInvalidUrl(input: string): string | null {
  const parsed = parseUrlCore(input);
  return isError(parsed) ? parsed.payload : null;
}

function finalizeParsedUrl(input: string, parsed: ParsedUrlCore): NormalizedUrl {
  const host = parsed.hostHasUppercase
    ? input.substring(parsed.hostStart, parsed.hostEnd).toLowerCase()
    : input.substring(parsed.hostStart, parsed.hostEnd);
  const normalizedPort =
    parsed.scheme === "http"
      ? parsed.port === DEFAULT_PORT_HTTP
        ? null
        : parsed.port
      : parsed.port === DEFAULT_PORT_HTTPS
        ? null
        : parsed.port;
  const path = parsed.pathStart === -1 ? "/" : input.substring(parsed.pathStart, parsed.pathEnd);
  const query = parsed.queryStart === -1 ? null : input.substring(parsed.queryStart, parsed.length);
  const authorityText = normalizedPort === null ? host : `${host}:${normalizedPort}`;
  const normalizedHref =
    query === null
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
