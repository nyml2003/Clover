import { type z } from "zod";

import { parseWith, type ZodBoundaryErrorPayload } from "@clover.js/zod";
import type { Result, Option } from "@clover.js/protocol";

import { toHttpBodyInput, toHttpCookiesInput, toHttpHeadersInput, toHttpQueryInput } from "./normalize.js";
import type { HttpCookies, HttpHeaders, HttpQuery, HttpRequest } from "./types.js";

export function parseHttpQueryWith<Schema extends z.ZodType>(
  schema: Schema,
  source: HttpRequest | HttpQuery
): Result<z.output<Schema>, number, ZodBoundaryErrorPayload> {
  return parseWith(schema, toHttpQueryInput(source));
}

export function parseHttpHeadersWith<Schema extends z.ZodType>(
  schema: Schema,
  source: HttpRequest | HttpHeaders
): Result<z.output<Schema>, number, ZodBoundaryErrorPayload> {
  return parseWith(schema, toHttpHeadersInput(source));
}

export function parseHttpCookiesWith<Schema extends z.ZodType>(
  schema: Schema,
  source: HttpRequest | HttpCookies
): Result<z.output<Schema>, number, ZodBoundaryErrorPayload> {
  return parseWith(schema, toHttpCookiesInput(source));
}

export function parseHttpBodyWith<Body, Schema extends z.ZodType>(
  schema: Schema,
  source: HttpRequest<Body> | Option<Body>
): Result<z.output<Schema>, number, ZodBoundaryErrorPayload> {
  return parseWith(schema, toHttpBodyInput(source));
}
