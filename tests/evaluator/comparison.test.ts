import {
  binary,
  comparison,
  conditionReference,
  conditional,
  fn,
  group,
  keep,
  pool,
} from "../../src/ast/builders.js";
import type { ExpressionNode } from "../../src/ast/nodes.js";
import { DieRegistry } from "../../src/dice/DieRegistry.js";
import { EvaluationError } from "../../src/errors/EvaluationError.js";
import { ValidationError } from "../../src/errors/ValidationError.js";
import { Evaluator } from "../../src/evaluator/Evaluator.js";
import { createRollContext } from "../../src/evaluator/RollContext.js";
import { ModifierRegistry } from "../../src/modifiers/ModifierRegistry.js";
import { Parser } from "../../src/parser/Parser.js";
import { EngineRegistry } from "../../src/random/EngineRegistry.js";
import { NumberGenerator } from "../../src/random/NumberGenerator.js";

const parser = new Parser();

function createEvaluator(rolls: readonly number[] = []) {
  const queue = [...rolls];
  const generator = new NumberGenerator(
    new EngineRegistry().create("mersenne", 7),
  );
  const integer = jest
    .spyOn(generator, "integer")
    .mockImplementation((min) => queue.shift() ?? min);
  const evaluator = new Evaluator({
    dice: new DieRegistry(),
    modifiers: new ModifierRegistry(),
  });

  return {
    evaluate: (input: string | ExpressionNode) =>
      evaluator.evaluate(
        typeof input === "string" ? parser.parse(input) : input,
        createRollContext({ generator }),
      ),
    integer,
  };
}

describe("comparison expressions", () => {
  test.each([
    ["=", 0, 1, 0],
    ["!=", 1, 0, 1],
    ["<>", 1, 0, 1],
    ["<", 1, 0, 0],
    [">", 0, 0, 1],
    ["<=", 1, 1, 0],
    [">=", 0, 1, 1],
  ] as const)(
    "%s handles less, equal and greater values",
    (op, less, equal, greater) => {
      const { evaluate } = createEvaluator();

      expect(evaluate(comparison(op, 1, 2)).value).toBe(less);
      expect(evaluate(comparison(op, 2, 2)).value).toBe(equal);
      expect(evaluate(comparison(op, 3, 2)).value).toBe(greater);
    },
  );

  test.each([
    ["-1.5 < -1", 1],
    ["0 = -0", 1],
    ["1/2 = 0.5", 1],
    ["1/0 > 100", 1],
    ["-1/0 < 0", 1],
    ["1/0 = 1/0", 1],
    ["1/0 != 1/0", 0],
  ])("compares numeric results for %s", (notation, expected) => {
    expect(createEvaluator().evaluate(notation).value).toBe(expected);
  });

  test("retains the original node and both evaluated operands", () => {
    const node = comparison(">=", binary("+", 2, 3), fn("abs", -5));
    const result = createEvaluator().evaluate(node);

    expect(result).toMatchObject({
      type: "comparison",
      value: 1,
      left: { type: "binary", value: 5 },
      right: { type: "function", value: 5 },
    });
    expect(result.node).toBe(node);
  });

  test.each([
    ["1+2*3>=7", 1],
    ["1<2+3", 1],
    ["(1<2)=1", 1],
    ["1<(2<3)", 0],
    ["(1<2)+(3>2)", 2],
    ["max(1<2, 2>3)", 1],
    ["{1<2, 3>2}", 2],
  ])("evaluates nested expression %s", (notation, expected) => {
    expect(createEvaluator().evaluate(notation).value).toBe(expected);
  });

  test("evaluates both operands once from left to right", () => {
    const { evaluate, integer } = createEvaluator([2, 5, 3]);
    const result = evaluate(comparison(">", pool(2, 6), pool(1, 6)));

    expect(result).toMatchObject({
      type: "comparison",
      value: 1,
      left: { type: "pool", value: 7, rolls: [{ value: 2 }, { value: 5 }] },
      right: { type: "pool", value: 3, rolls: [{ value: 3 }] },
    });
    expect(integer).toHaveBeenCalledTimes(3);
  });

  test("propagates operand errors without evaluating a later operand", () => {
    const { evaluate, integer } = createEvaluator([4]);

    expect(() => evaluate(comparison("=", fn("sqrt", -1), pool(1, 6)))).toThrow(
      EvaluationError,
    );
    expect(integer).not.toHaveBeenCalled();
    expect(() => evaluate(comparison("=", pool(1, 6), fn("sqrt", -1)))).toThrow(
      EvaluationError,
    );
    expect(integer).toHaveBeenCalledTimes(1);
    expect(() =>
      evaluate({ ...comparison("=", 1, 2), op: "==" } as never),
    ).toThrow(EvaluationError);
  });

  test("uses comparisons in calculated quantities and sides", () => {
    const { evaluate, integer } = createEvaluator([1]);
    const result = evaluate("(1<2)d(2>1)");

    expect(result).toMatchObject({
      type: "pool",
      value: 1,
      qty: { value: 1, inner: { type: "comparison", value: 1 } },
      dieArgs: [{ value: 1, inner: { type: "comparison", value: 1 } }],
    });
    expect(integer).toHaveBeenCalledTimes(1);
    expect(evaluate("(1>2)d6").value).toBe(0);
    expect(integer).toHaveBeenCalledTimes(1);
    expect(() => evaluate("d(1>2)")).toThrow(ValidationError);
  });

  test("distinguishes target scoring from a comparison of the pool total", () => {
    const target = createEvaluator([3, 4]);
    const total = createEvaluator([3, 4]);

    expect(target.evaluate("2d6>=5")).toMatchObject({
      type: "pool",
      value: 0,
      node: { modifiers: [{ name: "target" }] },
    });
    expect(total.evaluate("(2d6)>=5")).toMatchObject({
      type: "comparison",
      value: 1,
      left: { type: "paren", value: 7 },
    });
    expect(target.integer).toHaveBeenCalledTimes(2);
    expect(total.integer).toHaveBeenCalledTimes(2);
  });

  test("distinguishes explode from not-equal comparisons", () => {
    const explode = createEvaluator([6, 2]);
    const notEqual = createEvaluator([6]);
    const parenthesized = createEvaluator([6]);
    const target = createEvaluator([6]);

    expect(explode.evaluate("d6!>=6")).toMatchObject({
      type: "pool",
      value: 8,
      node: { modifiers: [{ name: "explode" }] },
    });
    expect(notEqual.evaluate("d6!=6")).toMatchObject({
      type: "pool",
      value: 7,
      node: {
        modifiers: [
          { name: "explode", comparePoint: { operator: "=", value: 6 } },
        ],
      },
    });
    expect(parenthesized.evaluate("(d6)!=5")).toMatchObject({
      type: "comparison",
      value: 1,
      left: { type: "paren", value: 6 },
    });
    expect(target.evaluate("d6<>5")).toMatchObject({
      type: "pool",
      value: 1,
      node: { modifiers: [{ name: "target" }] },
    });
    expect(explode.integer).toHaveBeenCalledTimes(2);
    expect(notEqual.integer).toHaveBeenCalledTimes(2);
    expect(parenthesized.integer).toHaveBeenCalledTimes(1);
    expect(target.integer).toHaveBeenCalledTimes(1);
  });

  test("a comparison check is evaluated once and only its selected branch rolls", () => {
    const { evaluate, integer } = createEvaluator([4, 2, 5]);
    const result = evaluate("((d6)>(d6)) ? (d6+$$condition) : (1d(0))");

    expect(result).toMatchObject({
      type: "conditional",
      value: 6,
      condition: { type: "comparison", value: 1 },
      selectedBranch: "true",
      selectedResult: { left: { value: 5 }, right: { value: 1 } },
    });
    expect(integer).toHaveBeenCalledTimes(3);
  });

  test("a false comparison selects the fallback and shorthand preserves its check", () => {
    const { evaluate, integer } = createEvaluator([2, 4, 5]);
    expect(evaluate("((d6)>(d6)) ?: (d6)")).toMatchObject({
      value: 5,
      condition: { type: "comparison", value: 0 },
      selectedBranch: "false",
      selectedResult: { type: "pool", value: 5 },
    });
    expect(integer).toHaveBeenCalledTimes(3);

    const truthy = createEvaluator([5, 2]);
    expect(truthy.evaluate("((d6)>(d6)) ?: (1d(0))")).toMatchObject({
      value: 1,
      selectedResult: {
        type: "reference",
        node: { type: "reference", namespace: "system", path: ["condition"] },
        value: 1,
      },
    });
    expect(truthy.integer).toHaveBeenCalledTimes(2);
  });

  test("comparison operands use the surrounding conditional binding", () => {
    const { evaluate } = createEvaluator();
    expect(
      evaluate(conditional(2, comparison(">", conditionReference(), 1), 0))
        .value,
    ).toBe(1);
    expect(() => evaluate(comparison("=", conditionReference(), 1))).toThrow(
      ValidationError,
    );
  });

  test("group keep recalculates both comparison operands without rerolling", () => {
    const { evaluate, integer } = createEvaluator([2, 5]);
    const result = evaluate(
      group([comparison("<", pool(1, 6), binary("-", pool(1, 6), 3))], {
        modifiers: [keep("h", 1)],
      }),
    );

    expect(result).toMatchObject({
      type: "group",
      value: 1,
      members: [
        {
          value: 1,
          calculationValue: 1,
          result: {
            type: "comparison",
            value: 1,
            left: { value: 0, rolls: [{ value: 2, useInTotal: false }] },
            right: {
              value: 2,
              left: { value: 5, rolls: [{ value: 5, useInTotal: true }] },
            },
          },
        },
      ],
    });
    expect(integer).toHaveBeenCalledTimes(2);
  });

  test("group recalculation changes comparison truth without revisiting a consumed check", () => {
    const { evaluate, integer } = createEvaluator([3, 5, 2]);
    const result = evaluate(
      group(
        [
          conditional(
            pool(1, 6),
            comparison("=", pool(1, 6), binary("+", pool(1, 6), 3)),
            0,
          ),
        ],
        { modifiers: [keep("h", 1)] },
      ),
    );

    expect(result).toMatchObject({
      value: 0,
      members: [
        {
          result: {
            type: "conditional",
            condition: { value: 3, rolls: [{ value: 3, useInTotal: true }] },
            selectedBranch: "true",
            selectedResult: {
              type: "comparison",
              value: 0,
              left: { value: 5, rolls: [{ value: 5, useInTotal: true }] },
              right: {
                value: 3,
                left: { value: 0, rolls: [{ value: 2, useInTotal: false }] },
              },
            },
          },
        },
      ],
    });
    expect(integer).toHaveBeenCalledTimes(3);
  });
});
