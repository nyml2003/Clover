import { describe, expect, it } from "vitest";
import { z } from "zod";

import { None, createError, isError } from "@clover.js/protocol";
import { ZodErrorCode } from "@clover.js/zod";
import {
  createHttpRequestContext,
  createHttpRequest,
  createHttpResponse,
  defineHttpHandler,
  emptyHttpRequestContext,
  emptyHttpRequestInput,
  emptyHttpResponseInput,
  formatHttpErrorBody,
  normalizeHttpHeaders,
  parseHttpBodyWith,
  parseHttpCookiesWith,
  parseHttpHeadersWith,
  parseHttpQueryWith,
  renderHttpResult,
  withHttpAuth,
  withHttpSession,
  toHttpBodyInput,
  toHttpCookiesInput,
  toHttpHeadersInput,
  toHttpQueryInput,
  toStatusCode
} from "@clover.js/http";

const WebTestErrorCode = {
  Unauthorized: 5001,
  BadRequest: 5002
} as const;

describe("@clover.js/http", () => {
  it("normalizes request method, query, headers, cookies and body", () => {
    const request = createHttpRequest({
      method: "post",
      path: "/users",
      query: "?page=1&debug",
      headers: {
        "Content-Type": "application/json",
        "X-Trace": ["a", "b"]
      },
      cookies: {
        session: "abc"
      },
      body: {
        name: "clover"
      },
      context: createHttpRequestContext({
        session: None,
        auth: None,
        data: {
          requestId: "req-1"
        }
      })
    });

    expect({
      ...request,
      query: { ...request.query }
    }).toEqual({
      method: "POST",
      path: "/users",
      query: {
        page: ["1"],
        debug: [None]
      },
      headers: {
        "content-type": ["application/json"],
        "x-trace": ["a", "b"]
      },
      cookies: {
        session: "abc"
      },
      body: {
        name: "clover"
      },
      context: {
        session: None,
        auth: None,
        data: {
          requestId: "req-1"
        }
      }
    });
  });

  it("defaults request body and context to stable empty values", () => {
    const request = createHttpRequest(emptyHttpRequestInput("get", "/health", {}));

    expect(request.body).toBe(None);
    expect(request.context).toEqual({
      session: None,
      auth: None,
      data: {}
    });
    expect(request.headers).toEqual({});
    expect(request.cookies).toEqual({});
  });

  it("creates fixed-shape session and auth context", () => {
    expect(
      createHttpRequestContext({
        session: "session-1",
        auth: None,
        data: {
          requestId: "req-1"
        }
      })
    ).toEqual({
      session: "session-1",
      auth: None,
      data: {
        requestId: "req-1"
      }
    });

    expect(emptyHttpRequestContext({ requestId: "req-2" })).toEqual({
      session: None,
      auth: None,
      data: {
        requestId: "req-2"
      }
    });
  });

  it("injects session and auth immutably into the request context", () => {
    const request = createHttpRequest(emptyHttpRequestInput("get", "/me", { requestId: "req-1" }));
    const withSession = withHttpSession(request, "session-1");
    const withAuth = withHttpAuth(withSession, {
      userId: "user-1"
    });

    expect(request.context).toEqual({
      session: None,
      auth: None,
      data: {
        requestId: "req-1"
      }
    });
    expect(withSession.context).toEqual({
      session: "session-1",
      auth: None,
      data: {
        requestId: "req-1"
      }
    });
    expect(withAuth.context).toEqual({
      session: "session-1",
      auth: {
        userId: "user-1"
      },
      data: {
        requestId: "req-1"
      }
    });
  });

  it("normalizes response headers into lowercase arrays", () => {
    expect(
      createHttpResponse(
        emptyHttpResponseInput(200, {
          ok: true
        })
      )
    ).toEqual({
      status: 200,
      headers: {},
      body: {
        ok: true
      }
    });
  });

  it("merges header keys with different cases", () => {
    expect(
      normalizeHttpHeaders({
        "X-Trace": "a",
        "x-trace": ["b"]
      })
    ).toEqual({
      "x-trace": ["a", "b"]
    });
  });

  it("renders successful handler results into stable http responses", () => {
    const handler = defineHttpHandler((request) => ({
      method: request.method,
      path: request.path
    }));

    const request = createHttpRequest({
      method: "get",
      path: "/users",
      query: None,
      headers: {},
      cookies: {},
      body: None,
      context: emptyHttpRequestContext({})
    });

    expect(
      renderHttpResult({
        request,
        execute: handler,
        onSuccess(value) {
          return {
            status: 200,
            headers: {},
            body: value
          };
        },
        mapStatus: {},
        errorHeaders: {}
      })
    ).toEqual({
      status: 200,
      headers: {},
      body: {
        method: "GET",
        path: "/users"
      }
    });
  });

  it("flattens query values into host input for schema parsing", () => {
    const request = createHttpRequest({
      method: "get",
      path: "/search",
      query: "?tag=a&tag=b&debug",
      headers: {},
      cookies: {},
      body: None,
      context: emptyHttpRequestContext({})
    });

    expect(toHttpQueryInput(request)).toEqual({
      tag: ["a", "b"],
      debug: undefined
    });
  });

  it("flattens headers and cookies into host input for schema parsing", () => {
    const request = createHttpRequest({
      method: "get",
      path: "/users",
      headers: {
        "X-Trace": ["a", "b"]
      },
      cookies: {
        session: "abc"
      },
      query: None,
      body: None,
      context: emptyHttpRequestContext({})
    });

    expect(toHttpHeadersInput(request)).toEqual({
      "x-trace": ["a", "b"]
    });
    expect(toHttpCookiesInput(request)).toEqual({
      session: "abc"
    });
  });

  it("unwraps missing body to undefined for schema parsing", () => {
    const request = createHttpRequest(emptyHttpRequestInput("get", "/users", {}));

    expect(toHttpBodyInput(request)).toBeUndefined();
  });

  it("parses query, headers, cookies and body through @clover.js/zod", () => {
    const request = createHttpRequest({
      method: "post",
      path: "/users",
      query: "?page=1",
      headers: {
        "Content-Type": "application/json"
      },
      cookies: {
        session: "abc"
      },
      body: {
        name: "clover"
      },
      context: emptyHttpRequestContext({})
    });

    expect(
      parseHttpQueryWith(
        z.object({
          page: z.string()
        }),
        request
      )
    ).toEqual({
      page: "1"
    });

    expect(
      parseHttpHeadersWith(
        z.object({
          "content-type": z.string()
        }),
        request
      )
    ).toEqual({
      "content-type": "application/json"
    });

    expect(
      parseHttpCookiesWith(
        z.object({
          session: z.string()
        }),
        request
      )
    ).toEqual({
      session: "abc"
    });

    expect(
      parseHttpBodyWith(
        z.object({
          name: z.string()
        }),
        request
      )
    ).toEqual({
      name: "clover"
    });
  });

  it("returns Clover boundary errors for invalid http host input", () => {
    const request = createHttpRequest(emptyHttpRequestInput("get", "/search", {}));

    const result = parseHttpQueryWith(
      z.object({
        page: z.string()
      }),
      request
    );

    expect(isError(result)).toBe(true);
    if (!isError(result)) {
      return;
    }

    expect(result.__code__).toBe(ZodErrorCode.ParseFailed);
    expect(result.payload.mode).toBe("parse");
    expect(result.payload.inputKind).toBe("object");
  });

  it("renders Clover errors into status code and error body", () => {
    const request = createHttpRequest(emptyHttpRequestInput("get", "/users", {}));

    const rendered = renderHttpResult({
      request,
      execute() {
        return createError(WebTestErrorCode.Unauthorized, {
          reason: "unauthorized"
        });
      },
      onSuccess(value) {
        return {
          status: 200,
          headers: {},
          body: value
        };
      },
      mapStatus: {
        5001: 401
      },
      errorHeaders: {}
    });

    expect(isError(rendered)).toBe(false);
    expect(rendered).toEqual({
      status: 401,
      headers: {},
      body: {
        code: 5001,
        message: "unauthorized"
      },
      error: createError(WebTestErrorCode.Unauthorized, {
        reason: "unauthorized"
      })
    });
  });

  it("formats error payloads into stable http error bodies", () => {
    expect(
      formatHttpErrorBody(createError(WebTestErrorCode.BadRequest, "bad-request"))
    ).toEqual({
      code: 5002,
      message: "bad-request"
    });
  });

  it("maps only safe http status codes", () => {
    expect(
      toStatusCode(createError(WebTestErrorCode.BadRequest, "bad-request"), {
        5002: 400
      })
    ).toBe(400);
    expect(
      toStatusCode(createError(WebTestErrorCode.BadRequest, "bad-request"), {
        5002: 99
      })
    ).toBe(500);
  });
});
