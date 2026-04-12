import { None, type Option } from "@clover.js/protocol";

import type {
  CreateHttpRequestContextInput,
  HttpContextData,
  HttpRequest,
  HttpRequestContext
} from "./types.js";

export function createHttpRequestContext<
  Session = unknown,
  Auth = unknown,
  Data extends HttpContextData = HttpContextData
>(
  input: CreateHttpRequestContextInput<Session, Auth, Data>
): HttpRequestContext<Session, Auth, Data> {
  return input;
}

export function emptyHttpRequestContext<Data extends HttpContextData>(
  data: Data
): HttpRequestContext<never, never, Data> {
  return {
    session: None,
    auth: None,
    data
  };
}

export function withHttpSession<
  Body,
  Session,
  Auth,
  Data extends HttpContextData,
  NextSession
>(
  request: HttpRequest<Body, HttpRequestContext<Session, Auth, Data>>,
  session: Option<NextSession>
): HttpRequest<Body, HttpRequestContext<NextSession, Auth, Data>> {
  return {
    ...request,
    context: {
      ...request.context,
      session
    }
  };
}

export function withHttpAuth<
  Body,
  Session,
  Auth,
  Data extends HttpContextData,
  NextAuth
>(
  request: HttpRequest<Body, HttpRequestContext<Session, Auth, Data>>,
  auth: Option<NextAuth>
): HttpRequest<Body, HttpRequestContext<Session, NextAuth, Data>> {
  return {
    ...request,
    context: {
      ...request.context,
      auth
    }
  };
}
