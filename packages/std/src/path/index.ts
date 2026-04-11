const DOT = ".";
const DOT_DOT = "..";
const SLASH = "/";

export type ParsedPath = {
  isAbsolute: boolean;
  hasTrailingSlash: boolean;
  normalized: string;
  segments: readonly string[];
};

function shouldPreserveTrailingSlash(input: string, normalizedSegments: readonly string[]): boolean {
  if (!input.endsWith(SLASH)) {
    return false;
  }

  return normalizedSegments.length > 0 || input.startsWith(SLASH);
}

export function normalizePathSegments(input: string): string {
  const isAbsolute = input.startsWith(SLASH);
  const rawSegments = input.split(SLASH);
  const normalizedSegments: string[] = [];

  for (const segment of rawSegments) {
    if (segment.length === 0 || segment === DOT) {
      continue;
    }

    if (segment === DOT_DOT) {
      const last = normalizedSegments.at(-1);

      if (last && last !== DOT_DOT) {
        normalizedSegments.pop();
        continue;
      }

      if (!isAbsolute) {
        normalizedSegments.push(segment);
      }

      continue;
    }

    normalizedSegments.push(segment);
  }

  if (normalizedSegments.length === 0) {
    return isAbsolute ? SLASH : DOT;
  }

  const normalized = normalizedSegments.join(SLASH);
  const withRoot = isAbsolute ? `${SLASH}${normalized}` : normalized;

  if (shouldPreserveTrailingSlash(input, normalizedSegments)) {
    return `${withRoot}${SLASH}`;
  }

  return withRoot;
}

export function splitPathSegments(input: string): readonly string[] {
  const normalized = normalizePathSegments(input);
  if (normalized === DOT || normalized === SLASH) {
    return [];
  }

  const offset = normalized.startsWith(SLASH) ? 1 : 0;
  const body = normalized.endsWith(SLASH) ? normalized.slice(offset, -1) : normalized.slice(offset);

  return body.length === 0 ? [] : body.split(SLASH);
}

export function joinPathSegments(
  segments: readonly string[],
  isAbsolute: boolean = false,
  hasTrailingSlash: boolean = false
): string {
  const body = segments.join(SLASH);
  const withRoot = isAbsolute ? `${SLASH}${body}` : body;

  if (withRoot.length === 0) {
    return isAbsolute ? SLASH : DOT;
  }

  if (hasTrailingSlash && !withRoot.endsWith(SLASH)) {
    return `${withRoot}${SLASH}`;
  }

  return withRoot;
}

export function parsePath(input: string): ParsedPath {
  const normalized = normalizePathSegments(input);

  return {
    isAbsolute: normalized.startsWith(SLASH),
    hasTrailingSlash: normalized.length > 1 && normalized.endsWith(SLASH),
    normalized,
    segments: splitPathSegments(normalized)
  };
}
