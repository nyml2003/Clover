import type { CloverError, ErrorPayload, Option, Result } from "@clover.js/protocol";

export type HttpHeaderValue = string | readonly string[];
export type HttpHeaderBagInput = Readonly<Record<string, HttpHeaderValue>>;
export type HttpHeaders = Readonly<Record<string, readonly string[]>>;
export type HttpCookies = Readonly<Record<string, string>>;
export type HttpQuery = Readonly<Record<string, readonly Option<string>[]>>;
export type HttpContextData = Readonly<Record<string, unknown>>;

export type CreateHttpRequestContextInput<
  Session = unknown,
  Auth = unknown,
  Data extends HttpContextData = HttpContextData
> = {
  session: Option<Session>;
  auth: Option<Auth>;
  data: Data;
};

export type HttpRequestContext<
  Session = unknown,
  Auth = unknown,
  Data extends HttpContextData = HttpContextData
> = {
  session: Option<Session>;
  auth: Option<Auth>;
  data: Data;
};

export type CreateHttpRequestInput<
  Body = unknown,
  Context extends HttpRequestContext = HttpRequestContext
> = {
  method: string;
  path: string;
  query: Option<string>;
  headers: HttpHeaderBagInput;
  cookies: HttpCookies;
  body: Option<Body>;
  context: Context;
};

export type HttpRequest<Body = unknown, Context extends HttpRequestContext = HttpRequestContext> = {
  method: string;
  path: string;
  query: HttpQuery;
  headers: HttpHeaders;
  cookies: HttpCookies;
  body: Option<Body>;
  context: Context;
};

export type CreateHttpResponseInput<Body> = {
  status: number;
  headers: HttpHeaderBagInput;
  body: Body;
};

export type HttpResponse<Body = unknown> = {
  status: number;
  headers: HttpHeaders;
  body: Body;
};

export type HttpErrorBody = {
  code: number;
  message: string;
};

export type HttpFailureResponse<
  ErrorCode extends number = number,
  Payload extends ErrorPayload = ErrorPayload
> = HttpResponse<HttpErrorBody> & {
  error: CloverError<ErrorCode, Payload>;
};

export type HttpRenderResult<
  Body = unknown,
  ErrorCode extends number = number,
  Payload extends ErrorPayload = ErrorPayload
> = HttpResponse<Body> | HttpFailureResponse<ErrorCode, Payload>;

export type HttpStatusMapping = Partial<Record<number, number>>;

export type HttpHandler<
  RequestBody = unknown,
  Context extends HttpRequestContext = HttpRequestContext,
  Value = unknown,
  ErrorCode extends number = number,
  Payload extends ErrorPayload = ErrorPayload
> = (request: HttpRequest<RequestBody, Context>) => Result<Value, ErrorCode, Payload>;

export type RenderHttpResultOptions<
  RequestBody,
  Context extends HttpRequestContext,
  Value,
  ResponseBody,
  ErrorCode extends number = number,
  Payload extends ErrorPayload = ErrorPayload
> = {
  request: HttpRequest<RequestBody, Context>;
  execute: HttpHandler<RequestBody, Context, Value, ErrorCode, Payload>;
  onSuccess: (
    value: Value,
    request: HttpRequest<RequestBody, Context>
  ) => HttpResponse<ResponseBody>;
  mapStatus: HttpStatusMapping;
  errorHeaders: HttpHeaderBagInput;
};
