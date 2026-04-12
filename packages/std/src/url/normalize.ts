import { None, isError, type Option, type Result } from "@clover.js/protocol";

import { parsePath } from "../path/index.js";
import {
  buildQueryString,
  getQueryParamValues,
  parseQueryString,
  toQueryRecord,
  type QueryParam
} from "../query/index.js";
import {
  DEFAULT_PORT_HTTP,
  DEFAULT_PORT_HTTPS,
  type NormalizeUrlResult,
  type ParsedUrlParts
} from "./shared.js";
import { parseUrlCore } from "./normalize-core.js";

export function normalizeUrl(input: string): NormalizeUrlResult {
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

export function parseUrlParts(
  input: string
): Result<ParsedUrlParts, 1701, string> {
  const normalized = normalizeUrl(input);
  if (isError(normalized)) {
    return normalized;
  }

  return {
    normalized,
    path: parsePath(normalized.path),
    queryParams: normalized.query === None ? [] : parseQueryString(normalized.query)
  };
}

export { buildQueryString, getQueryParamValues, parseQueryString, toQueryRecord };
export type { QueryParam };
