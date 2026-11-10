import {
  binary,
  compare,
  criticalFailure,
  criticalSuccess,
  die,
  drop,
  explode,
  fn,
  group,
  keep,
  max,
  min,
  negate,
  num,
  paren,
  pool,
  reRoll,
  sort,
  target,
  unique,
} from "../../src/ast/builders.js";
import type {
  ComparePoint,
  DescriptionNode,
  ExpressionNode,
  ModifierNode,
} from "../../src/ast/nodes.js";
import { nodeToNotation } from "../../src/ast/notation.js";
import { ValidationError } from "../../src/errors/ValidationError.js";
import { Parser } from "../../src/parser/Parser.js";

const parser = new Parser();

describe("builders match the parser", () => {
  test.each<[string, ExpressionNode]>([
    ["4", num(4)],
    ["2.5", num(2.5)],
    ["4d6", pool(4, 6)],
    ["d6", pool(1, 6)],
    ["d%", pool(1, die("percentile"))],
    ["3dF", pool(3, die("fudge"))],
    ["dF.1", pool(1, die("fudge", 1))],
    ["(2+3)d6", pool(paren(binary("+", 2, 3)), 6)],
    ["4d(2+3)", pool(4, paren(binary("+", 2, 3)))],
    ["4d6kh3", pool(4, 6, { modifiers: [keep("h", 3)] })],
    ["4d6k3", pool(4, 6, { modifiers: [keep("h", 3)] })],
    ["4d6d1", pool(4, 6, { modifiers: [drop("l")] })],
    ["4d6dh2", pool(4, 6, { modifiers: [drop("h", 2)] })],
    ["2d6!", pool(2, 6, { modifiers: [explode()] })],
    ["2d6!!", pool(2, 6, { modifiers: [explode({ compound: true })] })],
    ["2d6!p", pool(2, 6, { modifiers: [explode({ penetrate: true })] })],
    [
      "2d6!!p>4",
      pool(2, 6, {
        modifiers: [
          explode({
            compound: true,
            penetrate: true,
            comparePoint: compare(">", 4),
          }),
        ],
      }),
    ],
    [
      "2d6!!=4",
      pool(2, 6, {
        modifiers: [explode({ compound: true, comparePoint: compare("=", 4) })],
      }),
    ],
    [
      "2d6!<>4",
      pool(2, 6, { modifiers: [explode({ comparePoint: compare("<>", 4) })] }),
    ],
    [
      "8d10>=8f<=2",
      pool(8, 10, {
        modifiers: [target(compare(">=", 8), compare("<=", 2))],
      }),
    ],
    ["2d20r", pool(2, 20, { modifiers: [reRoll()] })],
    [
      "2d20ro<3",
      pool(2, 20, {
        modifiers: [reRoll({ once: true, comparePoint: compare("<", 3) })],
      }),
    ],
    ["4d6u", pool(4, 6, { modifiers: [unique()] })],
    [
      "4d6uo=1",
      pool(4, 6, {
        modifiers: [unique({ once: true, comparePoint: compare("=", 1) })],
      }),
    ],
    ["d20cs", pool(1, 20, { modifiers: [criticalSuccess()] })],
    [
      "d20cs>=19cf<=2",
      pool(1, 20, {
        modifiers: [
          criticalSuccess(compare(">=", 19)),
          criticalFailure(compare("<=", 2)),
        ],
      }),
    ],
    ["4d6s", pool(4, 6, { modifiers: [sort()] })],
    ["4d6sd", pool(4, 6, { modifiers: [sort("d")] })],
    ["4d6max5min2", pool(4, 6, { modifiers: [max(5), min(2)] })],
    ["4d6min-1.5", pool(4, 6, { modifiers: [min(-1.5)] })],
    ["2d6+3", binary("+", pool(2, 6), 3)],
    ["2d6-1d4*2", binary("-", pool(2, 6), binary("*", pool(1, 4), 2))],
    ["2^3", binary("^", 2, 3)],
    ["-2", negate(2)],
    ["2^-1", binary("^", 2, negate(1))],
    ["1d6*-2", binary("*", pool(1, 6), negate(2))],
    ["floor(2d6/2)", fn("floor", binary("/", pool(2, 6), 2))],
    ["max(1d6, 1d8)", fn("max", pool(1, 6), pool(1, 8))],
    [
      "{4d6+2d8, 3d20}k1",
      group([binary("+", pool(4, 6), pool(2, 8)), pool(3, 20)], {
        modifiers: [keep("h", 1)],
      }),
    ],
    ["4d6 // fire", pool(4, 6, { description: "fire" })],
    [
      "4d6 [fire]",
      pool(4, 6, { description: { text: "fire", style: "block" } }),
    ],
    ["{2d6} // group", group([pool(2, 6)], { description: "group" })],
  ])("%s", (notation, node) => {
    expect(node).toEqual(parser.parse(notation));
  });

  test("builder nodes write to notation that parses back to the same nodes", () => {
    const node = binary(
      "*",
      pool(4, 6, { modifiers: [explode(), keep("h", 3)] }),
      paren(binary("+", 2, negate(1))),
    );

    expect(parser.parse(nodeToNotation(node))).toEqual(node);
  });
});

describe("defaults and options", () => {
  test("modifiers default to their parser defaults", () => {
    expect(explode()).toEqual({
      type: "modifier",
      name: "explode",
      compound: false,
      penetrate: false,
    });
    expect(reRoll()).toEqual({
      type: "modifier",
      name: "re-roll",
      once: false,
    });
    expect(unique()).toEqual({ type: "modifier", name: "unique", once: false });
    expect(keep("l")).toEqual({
      type: "modifier",
      name: "keep",
      end: "l",
      qty: 1,
    });
    expect(drop("h")).toEqual({
      type: "modifier",
      name: "drop",
      end: "h",
      qty: 1,
    });
    expect(sort()).toEqual({ type: "modifier", name: "sort", direction: "a" });
    expect(criticalSuccess()).toEqual({
      type: "modifier",
      name: "critical-success",
    });
    expect(target(compare(">", 3))).toEqual({
      type: "modifier",
      name: "target",
      rules: [{ kind: "success", comparePoint: { operator: ">", value: 3 } }],
    });
  });

  test("optional properties are left out, so nodes stay JSON round-trippable", () => {
    const node = pool(4, 6);

    expect(node).not.toHaveProperty("description");
    expect(JSON.parse(JSON.stringify(node))).toEqual(node);
    expect(Object.keys(explode())).not.toContain("comparePoint");
  });

  test("repeated modifiers are de-duplicated like the parser (last wins)", () => {
    expect(
      pool(4, 6, { modifiers: [keep("h", 1), sort(), keep("h", 2)] }),
    ).toEqual(parser.parse("4d6kh1skh2"));
  });

  test("keep and drop are de-duplicated per end, like the parser", () => {
    const node = pool(4, 10, { modifiers: [drop("h", 1), drop("l", 2)] });

    expect(node.modifiers).toEqual([drop("h", 1), drop("l", 2)]);
    expect(node).toEqual(parser.parse("4d10dh1dl2"));
  });

  test.each(["pool", "group"] as const)(
    "%s deduplicates repeated target nodes like other modifiers",
    (kind) => {
      const first = target([
        { kind: "success", comparePoint: compare(">=", 8), amount: 1 },
      ]);
      const last = target([
        { kind: "success", comparePoint: compare(">=", 10), amount: 2 },
      ]);
      const modifiers = [first, keep("h", 1), last, keep("h", 2)];
      const node =
        kind === "pool"
          ? pool(4, 10, { modifiers })
          : group([pool(1, 10)], { modifiers });

      expect(node.modifiers).toEqual([last, keep("h", 2)]);
      expect(parser.parse(nodeToNotation(node))).toEqual(node);
    },
  );

  test("ordered target rules preserve explicit and omitted amounts", () => {
    const node = pool(4, 10, {
      modifiers: [
        target([
          { kind: "success", comparePoint: compare(">=", 8), amount: 1 },
          { kind: "failure", comparePoint: compare("<=", 2), amount: 10 },
          { kind: "failure", comparePoint: compare("=", 0) },
          { kind: "success", comparePoint: compare("=", 10), amount: 2 },
        ]),
      ],
    });

    expect(nodeToNotation(node)).toBe("4d10>=8:1f<=2:10f=0=10:2");
    expect(parser.parse(nodeToNotation(node))).toEqual(node);
    expect(target(compare(">=", 8), compare("<=", 2))).toEqual(
      target([
        { kind: "success", comparePoint: compare(">=", 8) },
        { kind: "failure", comparePoint: compare("<=", 2) },
      ]),
    );
  });

  test.each([0, 11, -1, 1.5, NaN, Infinity])(
    "target rejects amount %s",
    (amount) => {
      expect(() =>
        target([{ kind: "success", comparePoint: compare("=", 1), amount }]),
      ).toThrow(ValidationError);
    },
  );

  test.each([1, 10])("target accepts amount %s", (amount) => {
    expect(
      target([{ kind: "success", comparePoint: compare("=", 1), amount }])
        .rules[0].amount,
    ).toBe(amount);
  });

  test("target validates the structure of a rule block", () => {
    expect(() => target([])).toThrow(ValidationError);
    expect(() =>
      target([{ kind: "failure", comparePoint: compare("=", 1) }]),
    ).toThrow(ValidationError);
    expect(() =>
      target([
        {
          kind: "success",
          comparePoint: { operator: "~", value: 1 } as unknown as ComparePoint,
        },
      ]),
    ).toThrow(ValidationError);
  });

  test("a die node can be used for any registered die", () => {
    expect(pool(2, die("fib")).die).toEqual({
      type: "die",
      name: "fib",
      args: [],
    });
    expect(die("range", -2, 3).args).toEqual([num(-2), num(3)]);
  });

  test("description text is trimmed", () => {
    expect(pool(1, 6, { description: "  fire " }).description).toEqual({
      text: "fire",
      style: "inline",
    });
  });

  test("builders don't copy expression nodes", () => {
    const qty = paren(binary("+", 1, 2));

    expect(pool(qty, 6).qty).toBe(qty);
  });
});

describe("invalid input", () => {
  const invalidPoint = { operator: "~", value: 1 } as unknown as ComparePoint;

  test.each<[string, () => unknown]>([
    ["num(NaN)", () => num(Number.NaN)],
    ["num(Infinity)", () => num(Number.POSITIVE_INFINITY)],
    ["num('4')", () => num("4" as unknown as number)],
    ["die('')", () => die("")],
    ["die(name, NaN)", () => die("range", Number.NaN)],
    ["pool(qty: string)", () => pool("4" as unknown as number, 6)],
    ["pool(qty: object)", () => pool({} as unknown as number, 6)],
    ["pool(die: null)", () => pool(4, null as unknown as number)],
    [
      "pool(modifiers: not modifiers)",
      () => pool(4, 6, { modifiers: [num(1)] as unknown as ModifierNode[] }),
    ],
    ["pool(description: '')", () => pool(4, 6, { description: "  " })],
    [
      "pool(description: bad style)",
      () =>
        pool(4, 6, {
          description: {
            text: "x",
            style: "other",
          } as unknown as DescriptionNode,
        }),
    ],
    ["group([])", () => group([])],
    ["binary('x')", () => binary("x" as "+", 1, 2)],
    ["negate(undefined)", () => negate(undefined as unknown as number)],
    ["fn('nope')", () => fn("nope" as "abs", 1)],
    ["compare('~')", () => compare("~" as "=", 1)],
    ["compare(NaN)", () => compare("=", Number.NaN)],
    ["keep(0)", () => keep("h", 0)],
    ["keep(1.5)", () => keep("h", 1.5)],
    ["drop(-1)", () => drop("l", -1)],
    ["drop('x')", () => drop("x" as "h")],
    [
      "explode(bad compare point)",
      () => explode({ comparePoint: invalidPoint }),
    ],
    ["target(null)", () => target(null as unknown as ComparePoint)],
    ["target(bad failure)", () => target(compare("=", 1), invalidPoint)],
    ["reRoll(bad compare point)", () => reRoll({ comparePoint: invalidPoint })],
    ["unique(bad compare point)", () => unique({ comparePoint: invalidPoint })],
    ["criticalSuccess(bad)", () => criticalSuccess(invalidPoint)],
    ["criticalFailure(bad)", () => criticalFailure(invalidPoint)],
    ["sort('x')", () => sort("x" as "a")],
    ["max(Infinity)", () => max(Number.POSITIVE_INFINITY)],
    ["min(NaN)", () => min(Number.NaN)],
  ])("%s throws a ValidationError", (_, build) => {
    expect(build).toThrow(ValidationError);
  });
});
