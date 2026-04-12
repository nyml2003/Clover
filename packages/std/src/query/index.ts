import { None, type Option } from "@clover.js/protocol";

import { splitOnce } from "../string/index.js";

export type QueryParam = {
  key: string;
  value: Option<string>;
};

export function parseQueryString(input: string): readonly QueryParam[] {
  const query = input.startsWith("?") ? input.slice(1) : input;
  if (query.length === 0) {
    return [];
  }

  const segments = query.split("&");
  const params: QueryParam[] = [];

  for (const segment of segments) {
    if (segment.length === 0) {
      continue;
    }

    const split = splitOnce(segment, "=");
    if (split === None) {
      params.push({
        key: segment,
        value: None
      });
      continue;
    }

    params.push({
      key: split[0],
      value: split[1]
    });
  }

  return params;
}

export function buildQueryString(params: readonly QueryParam[]): string {
  if (params.length === 0) {
    return "";
  }

  let output = "";
  let isFirst = true;

  for (const param of params) {
    if (!isFirst) {
      output += "&";
    }

    output += param.key;
    if (param.value !== None) {
      output += `=${param.value}`;
    }

    isFirst = false;
  }

  return output;
}

export function getQueryParamValues(
  params: readonly QueryParam[],
  key: string
): readonly Option<string>[] {
  const values: Array<Option<string>> = [];

  for (const param of params) {
    if (param.key === key) {
      values.push(param.value);
    }
  }

  return values;
}

export function toQueryRecord(
  params: readonly QueryParam[]
): Record<string, readonly Option<string>[]> {
  const record: Record<string, Array<Option<string>>> = {};

  for (const param of params) {
    const values = record[param.key];
    if (values) {
      values.push(param.value);
      continue;
    }

    record[param.key] = [param.value];
  }

  return record;
}
