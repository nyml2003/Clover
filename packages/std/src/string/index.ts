import { None, type Option } from "@clover/protocol";

function toSingleCharCode(value: string): number {
  return value.length === 1 ? value.charCodeAt(0) : -1;
}

export function isAsciiWhitespaceChar(value: string): boolean {
  const code = toSingleCharCode(value);
  return code === 0x20 || (code >= 0x09 && code <= 0x0d);
}

export function isAsciiAlphaChar(value: string): boolean {
  const code = toSingleCharCode(value);
  return (code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a);
}

export function isAsciiDigitChar(value: string): boolean {
  const code = toSingleCharCode(value);
  return code >= 0x30 && code <= 0x39;
}

export function isAsciiHexChar(value: string): boolean {
  const code = toSingleCharCode(value);
  return (
    (code >= 0x30 && code <= 0x39) ||
    (code >= 0x41 && code <= 0x46) ||
    (code >= 0x61 && code <= 0x66)
  );
}

export function splitOnce(input: string, separator: string): Option<readonly [string, string]> {
  if (separator.length === 0) {
    return None;
  }

  const index = input.indexOf(separator);
  if (index === -1) {
    return None;
  }

  return [input.slice(0, index), input.slice(index + separator.length)] as const;
}

export function startsWithAt(input: string, prefix: string, index: number): boolean {
  if (!Number.isInteger(index) || index < 0) {
    return false;
  }

  if (index + prefix.length > input.length) {
    return false;
  }

  for (let offset = 0; offset < prefix.length; offset += 1) {
    if (input.charCodeAt(index + offset) !== prefix.charCodeAt(offset)) {
      return false;
    }
  }

  return true;
}

export function endsWithAt(input: string, suffix: string, endExclusive: number = input.length): boolean {
  if (!Number.isInteger(endExclusive) || endExclusive < 0) {
    return false;
  }

  const start = endExclusive - suffix.length;
  if (start < 0 || endExclusive > input.length) {
    return false;
  }

  for (let offset = 0; offset < suffix.length; offset += 1) {
    if (input.charCodeAt(start + offset) !== suffix.charCodeAt(offset)) {
      return false;
    }
  }

  return true;
}

export function safeCompareAscii(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let difference = 0;

  for (let index = 0; index < left.length; index += 1) {
    const leftCode = left.charCodeAt(index);
    const rightCode = right.charCodeAt(index);

    if (leftCode > 0x7f || rightCode > 0x7f) {
      return false;
    }

    difference |= leftCode ^ rightCode;
  }

  return difference === 0;
}
