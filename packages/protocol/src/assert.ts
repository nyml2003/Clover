export function assertNever(value: never, message: string = "Unexpected unreachable value"): never {
  throw new Error(message);
}
