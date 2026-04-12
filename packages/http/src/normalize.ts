import { None, type Option } from "@clover.js/protocol";
import { parseQueryRecord } from "@clover.js/std";

import { emptyHttpRequestContext } from "./context.js";
import type {
  CreateHttpRequestInput,
  CreateHttpResponseInput,
  HttpCookies,
  HttpContextData,
  HttpHeaderBagInput,
  HttpHeaderValue,
  HttpHeaders,
  HttpQuery,
  HttpRequest,
  HttpResponse,
  HttpRequestContext
} from "./types.js";

type HttpHeaderHostValue = string | readonly string[];
type HttpHeaderHostRecord = Readonly<Record<string, HttpHeaderHostValue>>;
type HttpCookieHostRecord = Readonly<Record<string, string>>;
type HttpQueryHostScalar = string | undefined;
type HttpQueryHostValue = HttpQueryHostScalar | readonly HttpQueryHostScalar[];
type HttpQueryHostRecord = Readonly<Record<string, HttpQueryHostValue>>;

function toHeaderValues(value: HttpHeaderValue): readonly string[] {
  return typeof value === "string" ? [value] : [...value];
}

function unwrapOptionalString(value: Option<string>): string | undefined {
  return value === None ? undefined : value;
}

function isHttpRequestLike(value: unknown): value is HttpRequest {
  return (
    typeof value === "object" &&
    value !== null &&
    "method" in value &&
    "path" in value &&
    "query" in value &&
    "headers" in value &&
    "cookies" in value &&
    "body" in value
  );
}

function readQuerySource(source: HttpRequest | HttpQuery): HttpQuery {
  return isHttpRequestLike(source) ? source.query : source;
}

function readHeaderSource(source: HttpRequest | HttpHeaders): HttpHeaders {
  return isHttpRequestLike(source) ? source.headers : source;
}

function readCookieSource(source: HttpRequest | HttpCookies): HttpCookies {
  return isHttpRequestLike(source) ? source.cookies : source;
}

function readBodySource<Body>(source: HttpRequest<Body> | Option<Body>): Option<Body> {
  return isHttpRequestLike(source) ? source.body : source;
}

export function normalizeHttpHeaders(headers: HttpHeaderBagInput): HttpHeaders {
  const normalized: Record<string, string[]> = {};

  for (const key of Object.keys(headers)) {
    const targetKey = key.toLowerCase();
    const nextValues = toHeaderValues(headers[key] ?? []);
    const current = normalized[targetKey];

    if (current) {
      current.push(...nextValues);
      continue;
    }

    normalized[targetKey] = [...nextValues];
  }

  return normalized;
}

export function createHttpRequest<
  Body = unknown,
  Context extends HttpRequestContext = HttpRequestContext
>(input: CreateHttpRequestInput<Body, Context>): HttpRequest<Body, Context> {
  const query = input.query === None ? "" : input.query;

  return {
    method: input.method.toUpperCase(),
    path: input.path,
    query: parseQueryRecord(query),
    headers: normalizeHttpHeaders(input.headers),
    cookies: input.cookies,
    body: input.body,
    context: input.context
  };
}

export function createHttpResponse<Body>(
  input: CreateHttpResponseInput<Body>
): HttpResponse<Body> {
  return {
    status: input.status,
    headers: normalizeHttpHeaders(input.headers),
    body: input.body
  };
}

export function toHttpQueryInput(source: HttpRequest | HttpQuery): HttpQueryHostRecord {
  const query = readQuerySource(source);
  const normalized: Record<string, HttpQueryHostValue> = {};

  for (const key of Object.keys(query)) {
    const values = query[key] ?? [];
    if (values.length === 0) {
      continue;
    }

    if (values.length === 1) {
      normalized[key] = unwrapOptionalString(values[0] ?? None);
      continue;
    }

    normalized[key] = values.map((value) => unwrapOptionalString(value ?? None));
  }

  return normalized;
}

export function toHttpHeadersInput(source: HttpRequest | HttpHeaders): HttpHeaderHostRecord {
  const headers = readHeaderSource(source);
  const normalized: Record<string, HttpHeaderHostValue> = {};

  for (const key of Object.keys(headers)) {
    const values = headers[key] ?? [];
    if (values.length === 0) {
      continue;
    }

    normalized[key] = values.length === 1 ? (values[0] ?? "") : [...values];
  }

  return normalized;
}

export function toHttpCookiesInput(source: HttpRequest | HttpCookies): HttpCookieHostRecord {
  return { ...readCookieSource(source) };
}

export function toHttpBodyInput<Body>(source: HttpRequest<Body> | Option<Body>): Body | undefined {
  const body = readBodySource(source);
  return body === None ? undefined : body;
}

export function emptyHttpRequestInput<
  Body = unknown,
  Data extends HttpContextData = HttpContextData
>(
  method: string,
  path: string,
  data: Data
): CreateHttpRequestInput<Body, HttpRequestContext<never, never, Data>> {
  return {
    method,
    path,
    query: None,
    headers: {},
    cookies: {},
    body: None,
    context: emptyHttpRequestContext(data)
  };
}

export function emptyHttpResponseInput<Body>(status: number, body: Body): CreateHttpResponseInput<Body> {
  return {
    status,
    headers: {},
    body
  };
}
