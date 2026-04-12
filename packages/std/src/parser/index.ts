import { None, createError, type CloverError, type Option, type Result } from "@clover.js/protocol";

import { startsWithAt } from "../string/index.js";

export type ParserMatch<T> = {
  value: T;
  nextIndex: number;
};

export type Parser<T> = (input: string, index: number) => Option<ParserMatch<T>>;

export type AstNode<Type extends string = string, Value = unknown> = {
  type: Type;
  start: number;
  end: number;
  value: Value;
};

export const ParserErrorCode = {
  NoMatch: 1801,
  TrailingInput: 1802
} as const;

type ParserErrorCodeValue = (typeof ParserErrorCode)[keyof typeof ParserErrorCode];

export type ParserErrorPayload = {
  index: number;
  expected: string;
  reason: string;
  found: string;
};

export type ParserError = CloverError<ParserErrorCodeValue, ParserErrorPayload>;

function createParserError<ErrorCode extends ParserErrorCodeValue>(
  code: ErrorCode,
  input: string,
  index: number,
  expected: string,
  reason: string
): CloverError<ErrorCode, ParserErrorPayload> {
  return createError(code, {
    index,
    expected,
    reason,
    found: input.slice(index, index + 16)
  });
}

export function createAstNode<Type extends string, Value>(
  type: Type,
  start: number,
  end: number,
  value: Value
): AstNode<Type, Value> {
  return {
    type,
    start,
    end,
    value
  };
}

export function literal(text: string): Parser<string> {
  if (text.length === 0) {
    return () => None;
  }

  return (input, index) => {
    if (!startsWithAt(input, text, index)) {
      return None;
    }

    return {
      value: text,
      nextIndex: index + text.length
    };
  };
}

export function charWhere(
  predicate: (char: string) => boolean
): Parser<string> {
  return (input, index) => {
    const char = input[index];
    if (!char || !predicate(char)) {
      return None;
    }

    return {
      value: char,
      nextIndex: index + 1
    };
  };
}

export function takeWhile(
  predicate: (char: string) => boolean,
  minLength: number = 0
): Parser<string> {
  return (input, index) => {
    let nextIndex = index;

    while (nextIndex < input.length) {
      const char = input[nextIndex];
      if (!char || !predicate(char)) {
        break;
      }

      nextIndex += 1;
    }

    if (nextIndex - index < minLength) {
      return None;
    }

    return {
      value: input.slice(index, nextIndex),
      nextIndex
    };
  };
}

export function mapParser<T, U>(
  parser: Parser<T>,
  map: (value: T, start: number, end: number) => U
): Parser<U> {
  return (input, index) => {
    const match = parser(input, index);
    if (match === None) {
      return None;
    }

    return {
      value: map(match.value, index, match.nextIndex),
      nextIndex: match.nextIndex
    };
  };
}

export function sequence<T extends readonly unknown[]>(
  ...parsers: { [Key in keyof T]: Parser<T[Key]> }
): Parser<T> {
  return (input, index) => {
    let nextIndex = index;
    const values: unknown[] = [];

    for (const parser of parsers) {
      const match = parser(input, nextIndex);
      if (match === None) {
        return None;
      }

      values.push(match.value);
      nextIndex = match.nextIndex;
    }

    return {
      value: values as unknown as T,
      nextIndex
    };
  };
}

export function choice<T>(...parsers: readonly Parser<T>[]): Parser<T> {
  return (input, index) => {
    for (const parser of parsers) {
      const match = parser(input, index);
      if (match !== None) {
        return match;
      }
    }

    return None;
  };
}

export function many<T>(
  parser: Parser<T>,
  minLength: number = 0
): Parser<readonly T[]> {
  return (input, index) => {
    const values: T[] = [];
    let nextIndex = index;

    while (nextIndex <= input.length) {
      const match = parser(input, nextIndex);
      if (match === None) {
        break;
      }

      if (match.nextIndex <= nextIndex) {
        break;
      }

      values.push(match.value);
      nextIndex = match.nextIndex;
    }

    if (values.length < minLength) {
      return None;
    }

    return {
      value: values,
      nextIndex
    };
  };
}

export function optionalParser<T>(parser: Parser<T>): Parser<Option<T>> {
  return (input, index) => {
    const match = parser(input, index);
    if (match === None) {
      return {
        value: None,
        nextIndex: index
      };
    }

    return match;
  };
}

export function separatedList<T, U>(
  itemParser: Parser<T>,
  separatorParser: Parser<U>,
  minLength: number = 0
): Parser<readonly T[]> {
  return (input, index) => {
    const first = itemParser(input, index);
    if (first === None) {
      return minLength === 0
        ? {
          value: [],
          nextIndex: index
        }
        : None;
    }

    const values: T[] = [first.value];
    let nextIndex = first.nextIndex;

    while (nextIndex <= input.length) {
      const separator = separatorParser(input, nextIndex);
      if (separator === None || separator.nextIndex <= nextIndex) {
        break;
      }

      const item = itemParser(input, separator.nextIndex);
      if (item === None || item.nextIndex <= separator.nextIndex) {
        break;
      }

      values.push(item.value);
      nextIndex = item.nextIndex;
    }

    if (values.length < minLength) {
      return None;
    }

    return {
      value: values,
      nextIndex
    };
  };
}

export function parseAll<T>(
  parser: Parser<T>,
  input: string,
  expected: string
): Result<T, ParserErrorCodeValue, ParserErrorPayload> {
  const match = parser(input, 0);
  if (match === None) {
    return createParserError(ParserErrorCode.NoMatch, input, 0, expected, "no-match");
  }

  if (match.nextIndex !== input.length) {
    return createParserError(
      ParserErrorCode.TrailingInput,
      input,
      match.nextIndex,
      expected,
      "trailing-input"
    );
  }

  return match.value;
}
