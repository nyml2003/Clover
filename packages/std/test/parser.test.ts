import { None, isError } from "@clover.js/protocol";
import { describe, expect, it } from "vitest";

import {
  charWhere,
  choice,
  createAstNode,
  literal,
  many,
  mapParser,
  optionalParser,
  parseAll,
  separatedList,
  sequence,
  takeWhile
} from "@clover.js/std";

const isAlpha = (char: string): boolean => /^[A-Za-z]$/.test(char);
const isDigit = (char: string): boolean => /^[0-9]$/.test(char);

describe("@clover.js/std parser", () => {
  it("matches literals, sequences, and choices", () => {
    const parser = choice(
      literal("alpha"),
      mapParser(sequence(literal("beta"), literal("-"), literal("1")), (value) => value.join(""))
    );

    expect(parseAll(parser, "alpha", "alpha-or-beta")).toBe("alpha");
    expect(parseAll(parser, "beta-1", "alpha-or-beta")).toBe("beta-1");
  });

  it("supports optional and repeated parsing", () => {
    const parser = sequence(
      literal("id"),
      optionalParser(literal("-")),
      many(charWhere(isDigit), 1)
    );

    expect(parseAll(parser, "id-123", "identifier")).toEqual(["id", "-", ["1", "2", "3"]]);
    expect(parseAll(parser, "id9", "identifier")).toEqual(["id", None, ["9"]]);
  });

  it("supports lightweight AST assembly through combinators", () => {
    const identifier = mapParser(takeWhile(isAlpha, 1), (value, start, end) =>
      createAstNode("identifier", start, end, value)
    );
    const comma = literal(",");
    const list = mapParser(separatedList(identifier, comma, 1), (value, start, end) =>
      createAstNode("list", start, end, value)
    );

    const result = parseAll(list, "alpha,beta,gamma", "identifier-list");
    expect(isError(result)).toBe(false);
    if (isError(result)) {
      return;
    }

    expect(result.type).toBe("list");
    expect(result.start).toBe(0);
    expect(result.end).toBe(16);
    expect(result.value.map((node) => node.value)).toEqual(["alpha", "beta", "gamma"]);
  });

  it("returns a structured error for no-match and trailing input", () => {
    const parser = takeWhile(isAlpha, 1);

    const noMatch = parseAll(parser, "123", "alpha");
    expect(isError(noMatch)).toBe(true);
    if (!isError(noMatch)) {
      return;
    }

    expect(noMatch.payload.reason).toBe("no-match");

    const trailing = parseAll(parser, "abc123", "alpha");
    expect(isError(trailing)).toBe(true);
    if (!isError(trailing)) {
      return;
    }

    expect(trailing.payload.reason).toBe("trailing-input");
    expect(trailing.payload.index).toBe(3);
  });
});
