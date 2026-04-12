const DOT = ".";
const SLASH = "/";
const DOT_CODE = 0x2e;
const SLASH_CODE = 0x2f;

export type ParsedPath = {
  isAbsolute: boolean;
  hasTrailingSlash: boolean;
  normalized: string;
  segmentBounds: readonly number[];
};

function isDotSegment(input: string, start: number, end: number): boolean {
  return end - start === 1 && input.charCodeAt(start) === DOT_CODE;
}

function isDotDotSegment(input: string, start: number, end: number): boolean {
  return (
    end - start === 2 &&
    input.charCodeAt(start) === DOT_CODE &&
    input.charCodeAt(start + 1) === DOT_CODE
  );
}

export function parsePath(input: string): ParsedPath {
  const length = input.length;
  const isAbsolute = length > 0 && input.charCodeAt(0) === SLASH_CODE;
  const inputBounds: number[] = [];
  let segmentStart = 0;
  let size = 0;

  while (segmentStart <= length) {
    let segmentEnd = segmentStart;

    while (segmentEnd < length && input.charCodeAt(segmentEnd) !== SLASH_CODE) {
      segmentEnd += 1;
    }

    if (isDotSegment(input, segmentStart, segmentEnd)) {
      // Skip "." segments.
    } else if (isDotDotSegment(input, segmentStart, segmentEnd)) {
      if (
        size > 0 &&
        !isDotDotSegment(input, inputBounds[size - 2]!, inputBounds[size - 1]!)
      ) {
        size -= 2;
      } else if (!isAbsolute) {
        inputBounds[size] = segmentStart;
        inputBounds[size + 1] = segmentEnd;
        size += 2;
      }
    } else if (segmentEnd > segmentStart) {
      inputBounds[size] = segmentStart;
      inputBounds[size + 1] = segmentEnd;
      size += 2;
    }

    if (segmentEnd === length) {
      break;
    }

    segmentStart = segmentEnd + 1;
  }

  const hasTrailingSlash = length > 0 && input.charCodeAt(length - 1) === SLASH_CODE && size > 0;

  if (size === 0) {
    return {
      isAbsolute,
      hasTrailingSlash,
      normalized: isAbsolute ? SLASH : DOT,
      segmentBounds: []
    };
  }

  let normalized = isAbsolute ? SLASH : "";
  const segmentBounds = new Array<number>(size);
  let offset = isAbsolute ? 1 : 0;

  for (let index = 0; index < size; index += 2) {
    if (index > 0) {
      normalized += SLASH;
      offset += 1;
    }

    segmentBounds[index] = offset;
    normalized += input.slice(inputBounds[index]!, inputBounds[index + 1]!);
    offset += inputBounds[index + 1]! - inputBounds[index]!;
    segmentBounds[index + 1] = offset;
  }

  if (hasTrailingSlash) {
    normalized += SLASH;
  }

  return {
    isAbsolute,
    hasTrailingSlash,
    normalized,
    segmentBounds
  };
}

export function getPathSegmentCount(path: ParsedPath): number {
  return path.segmentBounds.length >> 1;
}

export function readPathSegment(path: ParsedPath, index: number): string {
  const offset = index << 1;

  return path.normalized.slice(path.segmentBounds[offset]!, path.segmentBounds[offset + 1]!);
}

export function materializePathSegments(path: ParsedPath): readonly string[] {
  const count = getPathSegmentCount(path);
  const segments = new Array<string>(count);

  for (let index = 0; index < count; index += 1) {
    segments[index] = readPathSegment(path, index);
  }

  return segments;
}

export function normalizePathSegments(input: string): string {
  return parsePath(input).normalized;
}

export function splitPathSegments(input: string): readonly string[] {
  return materializePathSegments(parsePath(input));
}

export function joinPathSegments(
  segments: readonly string[],
  isAbsolute: boolean = false,
  hasTrailingSlash: boolean = false
): string {
  if (segments.length === 0) {
    return isAbsolute ? SLASH : DOT;
  }

  let output = isAbsolute ? SLASH : "";
  output += segments[0] ?? "";

  for (let index = 1; index < segments.length; index += 1) {
    output += SLASH;
    output += segments[index] ?? "";
  }

  if (hasTrailingSlash) {
    output += SLASH;
  }

  return output;
}
