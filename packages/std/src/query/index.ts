import { None, type Option } from "@clover.js/protocol";

const AMPERSAND = 0x26;
const EQUAL = 0x3d;
const QUESTION = 0x3f;

export type QueryParam = {
  key: string;
  value: Option<string>;
};

export type ParsedQuery = {
  source: string;
  entryBounds: readonly number[];
};

export type QueryRecord = Readonly<Record<string, readonly Option<string>[]>>;

function toQuerySource(input: string): string {
  return input.length > 0 && input.charCodeAt(0) === QUESTION ? input.slice(1) : input;
}

function appendQueryEntry(
  entryBounds: number[],
  size: number,
  segmentStart: number,
  equalsIndex: number,
  segmentEnd: number
): number {
  entryBounds[size] = segmentStart;
  entryBounds[size + 1] = equalsIndex === -1 ? segmentEnd : equalsIndex;
  entryBounds[size + 2] = equalsIndex === -1 ? -1 : equalsIndex + 1;
  entryBounds[size + 3] = segmentEnd;

  return size + 4;
}

function scanQueryBounds(source: string): readonly number[] {
  const length = source.length;
  const entryBounds: number[] = [];
  let index = 0;
  let segmentStart = 0;
  let equalsIndex = -1;
  let size = 0;

  while (index < length) {
    const code = source.charCodeAt(index);

    if (code === EQUAL) {
      if (equalsIndex === -1) {
        equalsIndex = index;
      }

      index += 1;
      continue;
    }

    if (code !== AMPERSAND) {
      index += 1;
      continue;
    }

    if (index > segmentStart) {
      size = appendQueryEntry(entryBounds, size, segmentStart, equalsIndex, index);
    }

    equalsIndex = -1;
    index += 1;
    segmentStart = index;
  }

  if (index > segmentStart) {
    appendQueryEntry(entryBounds, size, segmentStart, equalsIndex, index);
  }

  return entryBounds;
}

function appendQueryRecordValue(
  record: Record<string, Array<Option<string>>>,
  key: string,
  value: Option<string>
): void {
  const current = record[key];
  if (current === undefined) {
    record[key] = [value];
    return;
  }

  current.push(value);
}

export function parseQueryString(input: string): ParsedQuery {
  const source = toQuerySource(input);

  return {
    source,
    entryBounds: scanQueryBounds(source)
  };
}

export function getQueryParamCount(query: ParsedQuery): number {
  return query.entryBounds.length >> 2;
}

export function readQueryKey(query: ParsedQuery, index: number): string {
  const offset = index << 2;

  return query.source.slice(query.entryBounds[offset]!, query.entryBounds[offset + 1]!);
}

export function readQueryValue(query: ParsedQuery, index: number): Option<string> {
  const offset = index << 2;
  const valueStart = query.entryBounds[offset + 2]!;

  return valueStart === -1
    ? None
    : query.source.slice(valueStart, query.entryBounds[offset + 3]!);
}

export function materializeQueryParams(query: ParsedQuery): readonly QueryParam[] {
  const count = getQueryParamCount(query);
  const params = new Array<QueryParam>(count);

  for (let index = 0; index < count; index += 1) {
    params[index] = {
      key: readQueryKey(query, index),
      value: readQueryValue(query, index)
    };
  }

  return params;
}

export function parseQueryRecord(input: string): QueryRecord {
  const source = toQuerySource(input);
  const length = source.length;
  const record = Object.create(null) as Record<string, Array<Option<string>>>;
  let index = 0;
  let segmentStart = 0;
  let equalsIndex = -1;

  while (index < length) {
    const code = source.charCodeAt(index);

    if (code === EQUAL) {
      if (equalsIndex === -1) {
        equalsIndex = index;
      }

      index += 1;
      continue;
    }

    if (code !== AMPERSAND) {
      index += 1;
      continue;
    }

    if (index > segmentStart) {
      appendQueryRecordValue(
        record,
        source.slice(segmentStart, equalsIndex === -1 ? index : equalsIndex),
        equalsIndex === -1 ? None : source.slice(equalsIndex + 1, index)
      );
    }

    equalsIndex = -1;
    index += 1;
    segmentStart = index;
  }

  if (index > segmentStart) {
    appendQueryRecordValue(
      record,
      source.slice(segmentStart, equalsIndex === -1 ? index : equalsIndex),
      equalsIndex === -1 ? None : source.slice(equalsIndex + 1, index)
    );
  }

  return record;
}

export function buildQueryString(query: ParsedQuery): string {
  if (query.entryBounds.length === 0) {
    return "";
  }

  let output = query.source.slice(query.entryBounds[0]!, query.entryBounds[3]!);

  for (let offset = 4; offset < query.entryBounds.length; offset += 4) {
    output += "&";
    output += query.source.slice(query.entryBounds[offset]!, query.entryBounds[offset + 3]!);
  }

  return output;
}
