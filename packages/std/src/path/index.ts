const DOT = ".";
const DOT_DOT = "..";
const SLASH = "/";

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
