import type { CloverError, ErrorPayload } from "./error.js";

export type Result<
  T,
  ErrorCode extends number = number,
  Payload extends ErrorPayload = ErrorPayload
> = T | CloverError<ErrorCode, Payload>;
