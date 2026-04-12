import {
  isError,
  isErrorObjectPayload,
  isErrorScalarPayload,
  type CloverError,
  type ErrorPayload
} from "@clover.js/protocol";
import { inRange } from "@clover.js/std";

import { createHttpResponse } from "./normalize.js";
import type {
  HttpRequestContext,
  RenderHttpResultOptions,
  HttpErrorBody,
  HttpHandler,
  HttpRenderResult,
  HttpStatusMapping,
} from "./types.js";

function toErrorMessage(error: CloverError): string {
  if (isErrorScalarPayload(error.payload)) {
    return String(error.payload);
  }

  if (isErrorObjectPayload(error.payload)) {
    const preferredKeys = ["message", "reason", "firstMessage", "inputKind", "firstPath"];

    for (const key of preferredKeys) {
      const candidate = error.payload[key];
      if (isErrorScalarPayload(candidate)) {
        return String(candidate);
      }
    }
  }

  return "http-request-failed";
}

export function formatHttpErrorBody(error: CloverError): HttpErrorBody {
  return {
    code: error.__code__,
    message: toErrorMessage(error)
  };
}

export function toStatusCode(error: CloverError, mapping: HttpStatusMapping = {}): number {
  const mapped = mapping[error.__code__];

  if (
    typeof mapped === "number" &&
    Number.isInteger(mapped) &&
    inRange(mapped, 100, 599)
  ) {
    return mapped;
  }

  return 500;
}

export function defineHttpHandler<
  RequestBody = unknown,
  Context extends HttpRequestContext = HttpRequestContext,
  Value = unknown,
  ErrorCode extends number = number,
  Payload extends ErrorPayload = ErrorPayload
>(
  handler: HttpHandler<RequestBody, Context, Value, ErrorCode, Payload>
): HttpHandler<RequestBody, Context, Value, ErrorCode, Payload> {
  return handler;
}

export function renderHttpResult<
  RequestBody,
  Context extends HttpRequestContext,
  Value,
  ResponseBody,
  ErrorCode extends number = number,
  Payload extends ErrorPayload = ErrorPayload
>(
  options: RenderHttpResultOptions<
    RequestBody,
    Context,
    Value,
    ResponseBody,
    ErrorCode,
    Payload
  >
) : HttpRenderResult<ResponseBody, ErrorCode, Payload> {
  const result = options.execute(options.request);

  if (isError(result)) {
    const errorResponse = {
      status: toStatusCode(result, options.mapStatus),
      body: formatHttpErrorBody(result)
    };

    return {
      ...createHttpResponse({
        ...errorResponse,
        headers: options.errorHeaders
      }),
      error: result
    };
  }

  return createHttpResponse(options.onSuccess(result, options.request));
}
