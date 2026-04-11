import type { CloverError, ErrorData } from "./error.js";
export type Result<T, E extends ErrorData = ErrorData> = T | CloverError<E>;
