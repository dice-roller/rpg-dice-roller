import { NotationError } from "../../src/errors/NotationError.js";
import * as grammar from "../../src/parser/generated/grammar.js";
import { Parser } from "../../src/parser/Parser.js";

const parser = new Parser();

function notationError(notation: string): NotationError {
  try {
    parser.parse(notation);
  } catch (error) {
    if (error instanceof NotationError) return error;
    throw error;
  }

  throw new Error(`Expected invalid notation: ${notation}`);
}

interface Diagnostic {
  notation: string;
  offset: number;
  message?: string;
  expected?: string;
}

const sidesMessage =
  'Expected a number of sides or a die type after "d" (e.g. d6, d%, dF or d{1,2,3})';
const quantityMessage =
  "Dice quantity must be a positive whole number without leading zeros";
const customNumber = "a number for a custom die face or range";
const limitMessage =
  "Modifier limit must be a positive safe integer without leading zeros";

const diagnostics: Diagnostic[] = [
  ...["4de", "4d", "4d?", "4d-6", "4d "].map((notation) => ({
    notation,
    offset: 2,
    message: sidesMessage,
  })),
  {
    notation: "d0",
    offset: 1,
    message: "A standard die must have at least 1 side",
  },
  ...["d01", "d00", "d0006"].map((notation) => ({
    notation,
    offset: 1,
    message: "The number of sides must not have leading zeros",
  })),
  ...["0d6", "00d6", "01d6", "2.5d6", "2.0d6", "-4d6"].map((notation) => ({
    notation,
    offset: 0,
    message: quantityMessage,
  })),
  ...["4d6k", "4d6kh", "4d6kl", "4d6kx"].map((notation) => ({
    notation,
    offset: notation.endsWith("x") ? 4 : notation.length,
    expected: "a positive keep quantity (e.g. kh1)",
  })),
  ...["4d6d", "4d6dh", "4d6dl", "4d6dx"].map((notation) => ({
    notation,
    offset: notation.endsWith("x") ? 4 : notation.length,
    expected: "a positive drop quantity (e.g. dl1)",
  })),
  ...["k", "d"].flatMap((modifier) =>
    ["0", "01", "1.5", "1."].map((quantity) => ({
      notation: `4d6${modifier}${quantity}`,
      offset: 4,
      message: `${modifier === "k" ? "Keep" : "Drop"} quantity must be a positive whole number without leading zeros`,
    })),
  ),
  ...["!", "!!", "!p", "!!p", "r", "u"].flatMap((modifier) =>
    ["0", "01", "1.5", "1.", "9007199254740992"].map((limit) => ({
      notation: `d6${modifier}${limit}`,
      offset: 2 + modifier.length,
      message: limitMessage,
    })),
  ),
  ...["=", "!=", "<>", "<", ">", "<=", ">="].flatMap((operator) =>
    ["", "x"].map((value) => ({
      notation: `4d6${operator}${value}`,
      offset: 3 + operator.length,
      expected: "a number after the comparison operator",
    })),
  ),
  ...["min", "max"].flatMap((modifier) =>
    ["", "x"].map((value) => ({
      notation: `4d6${modifier}${value}`,
      offset: 6,
      expected: `a number after '${modifier}' (e.g. ${modifier}${modifier === "min" ? 2 : 5})`,
    })),
  ),
  ...["", "0", "3", "x"].map((value) => ({
    notation: `dF.${value}`,
    offset: 3,
    expected: "1 or 2 after dF.",
  })),
  ...[
    ["d{}", 2],
    ["d{x}", 2],
    ["d{1,}", 4],
    ["d{1,,2}", 4],
    ["d{1,2,}", 6],
    ["d{1:}", 4],
    ["d{1...}", 6],
    ["d{1:2:}", 6],
    ["d{1:2:x}", 6],
  ].map(([notation, offset]) => ({
    notation: notation as string,
    offset: offset as number,
    expected: customNumber,
  })),
  ...["", "x"].map((value) => ({
    notation: `d6=4:${value}`,
    offset: 5,
    expected: "a target amount between 1 and 10 after ':'",
  })),
  ...["0", "11", "1.0", "2.5"].map((value) => ({
    notation: `d6=4:${value}`,
    offset: 5,
    message: "Target amount must be an integer between 1 and 10",
  })),
];

// These contexts exercise speculative quantity parsing, function arguments, groups and operators.
// A generic error at the enclosing `(`, `{` or `d` must never replace the specific inner problem.
describe.each([
  ["on its own", "", ""],
  ["after an operator", "2 + ", ""],
  ["in parentheses", "(", ")"],
  ["in a function", "max(2, ", ")"],
  ["in a roll group", "{d8, ", "}"],
  ["on another line", "2 +\n", ""],
  ["after a description", "d6 [🎲] + ", ""],
])("helpful messages %s", (_, prefix, suffix) => {
  test.each(diagnostics)("$notation points to the problem", (diagnostic) => {
    const notation = prefix + diagnostic.notation + suffix;
    const offset = prefix.length + diagnostic.offset;
    const found = notation[offset];
    const message =
      diagnostic.message ??
      `Expected ${diagnostic.expected} but ${found === undefined ? "end of input" : JSON.stringify(found)} found.`;
    const precedingLines = notation.slice(0, offset).split("\n");
    const error = notationError(notation);

    expect(error.message).toBe(`Invalid notation "${notation}": ${message}`);
    expect(error.notation).toBe(notation);
    expect(error.location).toEqual({
      offset,
      line: precedingLines.length,
      column: precedingLines[precedingLines.length - 1].length + 1,
    });
    expect(error.cause).toBeInstanceOf(grammar.SyntaxError);
    expect(error.cause).toMatchObject({
      message,
      location: { start: error.location },
    });
  });
});

describe("Peggy fallback errors", () => {
  test.each([
    ["4d6x", 3, '"x"'],
    ["2 +", 3, "end of input"],
    ["(2d6", 4, "end of input"],
    ["d(2+)", 4, '")"'],
    ["{4d6,}", 5, '"}"'],
    ["d{1..3}", 4, '"."'],
    ["d{1,+}", 5, '"}"'],
    ["d{1.}", 4, '"}"'],
    ["4d6>=-", 6, "end of input"],
    ["4d6>=1.", 7, "end of input"],
    ["d6min-", 6, "end of input"],
    ["pow(2)", 5, '")"'],
    ["abs(2,3)", 5, '","'],
  ])(
    "%s keeps the default error and its precise location",
    (notation, offset, found) => {
      const error = notationError(notation);
      let rawError: unknown;
      try {
        grammar.parse(notation);
      } catch (caught) {
        rawError = caught;
      }

      expect(rawError).toBeInstanceOf(grammar.SyntaxError);
      const syntaxError = rawError as grammar.SyntaxError;
      expect(error.message).toBe(
        `Invalid notation "${notation}": ${syntaxError.message}`,
      );
      expect(syntaxError.message).toMatch(/^Expected /);
      expect(syntaxError.message).toContain(`but ${found} found.`);
      expect(
        syntaxError.expected.some(
          ({ type }) => type === "literal" || type === "class",
        ),
      ).toBe(true);
      expect(error.location).toEqual({ offset, line: 1, column: offset + 1 });
    },
  );

  test.each(["d{1,+}", "d{1.}", "4d6>=-", "4d6>=1.", "d6min-"])(
    "%s retains the inner digit expectation",
    (notation) => {
      const cause = notationError(notation).cause as grammar.SyntaxError;
      expect(cause.message).toMatch(/^Expected \[0-9\] but /);
      expect(cause.expected).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: "class", parts: [["0", "9"]] }),
        ]),
      );
    },
  );
});

describe("existing semantic diagnostics", () => {
  test.each([
    ["1000d6", "Dice quantity must be between 1 and 999"],
    ["d{3:1}", "A custom die range step points away from its end"],
    ["d{0:0:2}", "A custom die range step must not be zero"],
    [
      "d{0:0.00001:0.0001}",
      "Custom die step cannot have more than 4 decimal places",
    ],
    [
      "d6ro3",
      "A re-roll modifier cannot combine the once alias and a numeric limit",
    ],
    [
      "d6uo3",
      "A unique modifier cannot combine the once alias and a numeric limit",
    ],
    ["d6 []", "Description text cannot be empty"],
  ])("%s retains its validation message", (notation, message) => {
    expect(notationError(notation).message).toBe(
      `Invalid notation "${notation}": ${message}`,
    );
  });
});

describe("formatted diagnostics", () => {
  test("formats a targeted error with a caret", () => {
    expect(notationError("4de").format()).toBe(
      `Error: ${sidesMessage}\n --> notation:1:3\n  |\n1 | 4de\n  |   ^`,
    );
  });

  test("formats a default error with a caret", () => {
    const error = notationError("4d6>=-");
    expect(error.format()).toBe(
      "Error: Expected [0-9] but end of input found.\n --> notation:1:7\n  |\n1 | 4d6>=-\n  |       ^",
    );
  });

  test.each(["\n", "\r\n"])("uses the correct line after %j", (newline) => {
    const error = notationError(`2 +${newline}4de`);
    expect(error.location).toEqual({
      offset: 5 + newline.length,
      line: 2,
      column: 3,
    });
    expect(error.format()).toBe(
      `Error: ${sidesMessage}\n --> notation:2:3\n  |\n2 | 4de\n  |   ^`,
    );
  });

  test("marks a complete invalid numeric token", () => {
    expect(notationError("4d6kh1.5").format()).toContain(
      "1 | 4d6kh1.5\n  |      ^^^",
    );
  });

  test.each(["4de", "4d", "0d6", "d{1,}", "4d6x"])(
    "%s keeps its message, location and cause after formatting",
    (notation) => {
      const error = notationError(notation);
      const { message, location, cause } = error;
      expect(error.format()).toBe(error.format());
      expect(error.message).toBe(message);
      expect(error.location).toBe(location);
      expect(error.cause).toBe(cause);
    },
  );
});
