import {
  binary,
  die,
  fn,
  negate,
  num,
  paren,
  pool,
} from "../../src/ast/builders.js";
import type { ExpressionNode } from "../../src/ast/nodes.js";
import { DieRegistry } from "../../src/dice/DieRegistry.js";
import { faceDie } from "../../src/dice/presets.js";
import { EvaluationError } from "../../src/errors/EvaluationError.js";
import { ValidationError } from "../../src/errors/ValidationError.js";
import { Evaluator, sumIncluded } from "../../src/evaluator/Evaluator.js";
import { createRollContext } from "../../src/evaluator/RollContext.js";
import type { RollLimits, RollMode } from "../../src/evaluator/RollContext.js";
import { ModifierRegistry } from "../../src/modifiers/ModifierRegistry.js";
import { Parser } from "../../src/parser/Parser.js";
import { NumberGenerator } from "../../src/random/NumberGenerator.js";
import { MersenneTwister19937 } from "../../src/random/engines.js";
import {
  createDieResult,
  excludeFromTotal,
  withCalculationValue,
} from "../../src/results/die-result.js";

const parser = new Parser({ maxQty: 10_000 });

interface EvaluateOptions {
  mode?: RollMode;
  /** Values returned by `generator.integer()`, in order. */
  rolls?: number[];
  dice?: DieRegistry;
  limits?: Partial<RollLimits>;
}

function evaluate(
  input: string | ExpressionNode,
  {
    mode = "random",
    rolls,
    dice = new DieRegistry(),
    limits,
  }: EvaluateOptions = {},
) {
  const generator = new NumberGenerator(MersenneTwister19937.seed(7));

  if (rolls) {
    jest
      .spyOn(generator, "integer")
      .mockImplementation(() => rolls.shift() ?? 1);
  }

  const evaluator = new Evaluator({ dice, modifiers: new ModifierRegistry() });
  const node = typeof input === "string" ? parser.parse(input) : input;

  return evaluator.evaluate(
    node,
    createRollContext({ generator, mode, limits }),
  );
}

function evaluatePool(
  input: string | ExpressionNode,
  options?: EvaluateOptions,
) {
  const result = evaluate(input, options);

  if (result.type !== "pool") {
    throw new Error(`Expected a pool, got ${result.type}`);
  }

  return result;
}

describe("numbers and maths", () => {
  test("a number", () => {
    expect(evaluate("4.5")).toEqual({
      type: "number",
      node: num(4.5),
      value: 4.5,
    });
  });

  test.each([
    ["2+3", 5],
    ["2-3", -1],
    ["2*3", 6],
    ["3/2", 1.5],
    ["5%3", 2],
    ["5%-3", -1],
    ["2^3", 8],
    ["2**3", 8],
    ["2^-1", 0.5],
    ["-2", -2],
    ["(2+3)*2", 10],
    ["2+3*2", 8],
    ["10-4-3", 3],
    ["abs(-2)", 2],
    ["ceil(1.2)", 2],
    ["cos(0)", 1],
    ["exp(0)", 1],
    ["floor(1.8)", 1],
    ["log(1)", 0],
    ["round(2.5)", 3],
    ["round(-2.5)", -3],
    ["sign(-3)", -1],
    ["sin(0)", 0],
    ["sqrt(9)", 3],
    ["tan(0)", 0],
    ["trunc(-1.7)", -1],
    ["pow(2, 5)", 32],
    ["max(2, 5)", 5],
    ["min(2, 5)", 2],
    ["1/0", Number.POSITIVE_INFINITY],
    ["-1/0", Number.NEGATIVE_INFINITY],
  ])("%s = %d", (notation, value) => {
    expect(evaluate(notation).value).toBe(value);
  });

  test("results mirror the AST", () => {
    const result = evaluate("floor((2+3)*-1)");

    expect(result).toMatchObject({
      type: "function",
      value: -5,
      args: [
        {
          type: "binary",
          value: -5,
          left: {
            type: "paren",
            value: 5,
            inner: {
              type: "binary",
              value: 5,
              left: { type: "number", value: 2 },
              right: { type: "number", value: 3 },
            },
          },
          right: { type: "unary", value: -1, operand: { value: 1 } },
        },
      ],
    });
    expect(result.node).toEqual(parser.parse("floor((2+3)*-1)"));
  });

  test.each(["sqrt(-4)", "log(-1)", "0/0", "1/0-1/0", "(1/0)*0"])(
    "%s has no real result and throws an EvaluationError",
    (notation) => {
      expect(() => evaluate(notation)).toThrow(EvaluationError);
    },
  );
});

describe("dice pools", () => {
  test("4d6 rolls the die 4 times and sums the rolls", () => {
    const result = evaluatePool("4d6", { rolls: [3, 5, 6, 3] });

    expect(result).toEqual({
      type: "pool",
      node: parser.parse("4d6"),
      value: 17,
      qty: { type: "number", node: num(4), value: 4 },
      dieArgs: [{ type: "number", node: num(6), value: 6 }],
      die: { notation: "6", min: 1, max: 6, average: 3.5, faceCount: 6 },
      rolls: [3, 5, 6, 3].map(createDieResult),
    });
  });

  test("the result tree is JSON-safe", () => {
    const result = evaluate("2d6+floor(d%/10)");

    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });

  test.each<[string, RollMode, number[], number]>([
    ["4d6", "min", [1, 1, 1, 1], 4],
    ["4d6", "max", [6, 6, 6, 6], 24],
    ["2d%", "max", [100, 100], 200],
    ["4dF", "min", [-1, -1, -1, -1], -4],
    ["4dF.1", "max", [1, 1, 1, 1], 4],
    ["2d(2+3)", "max", [5, 5], 10],
  ])("%s in %s mode", (notation, mode, values, total) => {
    const result = evaluatePool(notation, { mode });

    expect(result.rolls.map(({ value }) => value)).toEqual(values);
    expect(result.value).toBe(total);
  });

  test("min / max mode doesn't use the generator", () => {
    const generator = new NumberGenerator();
    const integer = jest.spyOn(generator, "integer");
    const evaluator = new Evaluator({
      dice: new DieRegistry(),
      modifiers: new ModifierRegistry(),
    });

    evaluator.evaluate(
      parser.parse("4d6+2dF"),
      createRollContext({ generator, mode: "max" }),
    );

    expect(integer).not.toHaveBeenCalled();
  });

  test.each<[string, string, number[], number[], number]>([
    ["d%", "%", [42], [42], 42],
    ["3dF", "F", [0, 1, 2], [-1, 0, 1], 0],
    ["2dF.1", "F.1", [0, 5], [-1, 1], 0],
  ])("%s", (notation, label, indexes, values, total) => {
    const result = evaluatePool(notation, { rolls: indexes });

    expect(result.die.notation).toBe(label);
    expect(result.rolls.map(({ value }) => value)).toEqual(values);
    expect(result.value).toBe(total);
  });

  test("computed quantities and sides are evaluated", () => {
    const result = evaluatePool("(1+1)d(2*3)", { rolls: [2, 6] });

    expect(result.qty).toMatchObject({ type: "paren", value: 2 });
    expect(result.dieArgs).toMatchObject([{ type: "paren", value: 6 }]);
    expect(result.die.max).toBe(6);
    expect(result.value).toBe(8);
  });

  test("a quantity can contain dice", () => {
    // `(1d4)d6`: the inner d4 rolls 3, so 3d6 are rolled
    const result = evaluatePool(pool(paren(pool(1, 4)), 6), {
      rolls: [3, 1, 2, 3],
    });

    expect(result.qty.value).toBe(3);
    expect(result.rolls).toHaveLength(3);
    expect(result.value).toBe(6);
  });

  test("range and face dice can be rolled from builder nodes", () => {
    expect(
      evaluatePool(pool(2, die("range", -2, 3)), { mode: "min" }),
    ).toMatchObject({ value: -4, die: { notation: "-2..3" } });
    expect(
      evaluatePool(pool(2, die("face", 1, 1, 2)), { rolls: [0, 2] }),
    ).toMatchObject({ value: 3, die: { notation: "{1,1,2}", faceCount: 3 } });
  });

  test("registered dice are created by name", () => {
    const dice = new DieRegistry().register("fib", () =>
      faceDie([1, 1, 2, 3, 5, 8], { notation: "fib" }),
    );

    expect(
      evaluatePool(pool(2, die("fib")), { dice, rolls: [5, 4] }),
    ).toMatchObject({ value: 13, die: { notation: "fib", max: 8 } });
  });

  test("replacing a built-in factory changes what the notation rolls", () => {
    const dice = new DieRegistry().register("standard", (sides) => ({
      min: 1,
      max: sides,
      roll: () => sides,
    }));

    expect(evaluatePool("3d6", { dice }).value).toBe(18);
  });

  test("a die's own roll() and values are used", () => {
    const dice = new DieRegistry().register("loaded", () => ({
      min: 1,
      max: 6,
      average: 5,
      roll: () => 6,
    }));
    const result = evaluatePool(pool(2, die("loaded")), { dice });

    expect(result.value).toBe(12);
    expect(result.die.average).toBe(5);
  });

  test.each<[string, ExpressionNode]>([
    ["more dice than maxQty", pool(11, 6)],
    ["a computed quantity over maxQty", pool(binary("*", 4, 3), 6)],
    ["a computed quantity of 0", pool(binary("-", 1, 1), 6)],
    ["a negative quantity", pool(negate(2), 6)],
    ["a non-integer quantity", pool(binary("/", 5, 2), 6)],
    ["an infinite quantity", pool(binary("/", 1, 0), 6)],
  ])("%s throws an EvaluationError", (_, node) => {
    expect(() => evaluate(node, { limits: { maxQty: 10 } })).toThrow(
      EvaluationError,
    );
  });

  test.each<[string, ExpressionNode, DieRegistry]>([
    ["an unknown die", pool(1, die("nope")), new DieRegistry()],
    ["a removed built-in", pool(1, 6), DieRegistry.empty()],
    ["invalid sides", pool(1, binary("-", 1, 1)), new DieRegistry()],
    ["non-integer sides", pool(1, binary("/", 5, 2)), new DieRegistry()],
    ["an invalid fudge die", pool(1, die("fudge", 3)), new DieRegistry()],
    [
      "an invalid custom die",
      pool(1, die("broken")),
      new DieRegistry().register("broken", () => ({ min: 6, max: 1 })),
    ],
  ])("%s throws a ValidationError", (_, node, dice) => {
    expect(() => evaluate(node, { dice })).toThrow(ValidationError);
  });

  test("a custom roll() returning a non-number throws an EvaluationError", () => {
    const dice = new DieRegistry().register("bad", () => ({
      min: 1,
      max: 6,
      roll: () => Number.NaN,
    }));

    expect(() => evaluate(pool(1, die("bad")), { dice })).toThrow(
      EvaluationError,
    );
  });

  test("dice and maths combine", () => {
    const result = evaluate("floor(2d6/3)+1d4", { rolls: [4, 5, 2] });

    expect(result.value).toBe(5);
  });

  test("seeded generators give the same results", () => {
    expect(evaluate("10d20+4dF")).toEqual(evaluate("10d20+4dF"));
  });
});

describe("invalid nodes", () => {
  test.each<[string, ExpressionNode]>([
    ["an unknown node type", { type: "nope" } as unknown as ExpressionNode],
    [
      "an unknown operator",
      { ...binary("+", 1, 2), op: "&" } as unknown as ExpressionNode,
    ],
    [
      "an unknown function",
      { ...fn("abs", 1), name: "nope" } as unknown as ExpressionNode,
    ],
    [
      "a unary function with two arguments",
      { type: "function", name: "floor", args: [num(1), num(2)] },
    ],
    ["a binary function with one argument", fn("max", 1)],
    ["a non-finite number", { type: "number", value: Number.NaN }],
  ])("%s throws an EvaluationError", (_, node) => {
    expect(() => evaluate(node)).toThrow(EvaluationError);
  });
});

describe("sumIncluded", () => {
  test("sums the calculation value of included items", () => {
    expect(
      sumIncluded([
        createDieResult(3),
        excludeFromTotal(createDieResult(6)),
        withCalculationValue(createDieResult(8), 1),
      ]),
    ).toBe(4);
    expect(sumIncluded([])).toBe(0);
  });

  test("infinite values can be summed, but not to NaN", () => {
    const infinite = withCalculationValue(
      createDieResult(1),
      Number.POSITIVE_INFINITY,
    );

    expect(sumIncluded([infinite, createDieResult(1)])).toBe(
      Number.POSITIVE_INFINITY,
    );
    expect(() =>
      sumIncluded([
        infinite,
        withCalculationValue(createDieResult(1), Number.NEGATIVE_INFINITY),
      ]),
    ).toThrow(EvaluationError);
  });
});
