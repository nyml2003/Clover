import { None, isError, type Option, type Result, type SmiInt } from "@clover.js/protocol";

import { parsePath } from "../path/index.js";
import { parseQueryString } from "../query/index.js";
import {
  DEFAULT_PORT_HTTP,
  DEFAULT_PORT_HTTPS,
  type NormalizedUrl,
  type NormalizeUrlResult,
  type ParsedUrlParts
} from "./shared.js";
import { parseUrlCore } from "./normalize-core.js";

type NormalizedUrlState = {
  normalized: NormalizeUrlResult extends Result<infer Value, number, string> ? Value : never;
  path: ReturnType<typeof parsePath>;
  parsedQuery: Option<ReturnType<typeof parseQueryString>>;
};

function normalizeUrlState(
  input: string
): Result<NormalizedUrlState, 1701, string> {
  const parsed = parseUrlCore(input);
  if (isError(parsed)) {
    return parsed;
  }

  const host = parsed.hostHasUppercase
    ? input.substring(parsed.hostStart, parsed.hostEnd).toLowerCase()
    : input.substring(parsed.hostStart, parsed.hostEnd);
  let normalizedPort: Option<SmiInt> = parsed.port;
  if (parsed.scheme === "http" && parsed.port === DEFAULT_PORT_HTTP) {
    normalizedPort = None;
  } else if (parsed.scheme === "https" && parsed.port === DEFAULT_PORT_HTTPS) {
    normalizedPort = None;
  }
  const path = parsePath(
    parsed.pathStart === -1 ? "/" : input.substring(parsed.pathStart, parsed.pathEnd)
  );
  const query: Option<string> =
    parsed.queryStart === -1 ? None : input.substring(parsed.queryStart, parsed.length);
  const authorityText = normalizedPort === None ? host : `${host}:${normalizedPort}`;
  const normalizedHref =
    query === None
      ? `${parsed.scheme}://${authorityText}${path.normalized}`
      : `${parsed.scheme}://${authorityText}${path.normalized}?${query}`;
  const normalized: NormalizedUrl = {
    scheme: parsed.scheme,
    host,
    port: normalizedPort,
    path: path.normalized,
    query,
    normalizedHref
  };

  return {
    normalized,
    path,
    parsedQuery: query === None ? None : parseQueryString(query)
  };
}

export function normalizeUrl(input: string): NormalizeUrlResult {
  const state = normalizeUrlState(input);

  return isError(state) ? state : state.normalized;
}

export function explainInvalidUrl(input: string): Option<string> {
  const result = normalizeUrlState(input);
  return isError(result) ? result.payload : None;
}

export function parseUrlParts(
  input: string
): Result<ParsedUrlParts, 1701, string> {
  const state = normalizeUrlState(input);
  if (isError(state)) {
    return state;
  }

  return {
    normalized: state.normalized,
    path: state.path,
    parsedQuery: state.parsedQuery
  };
}
