import {
  conditionReference,
  conditional,
  die,
  pool,
} from "../../src/ast/builders.js";
import { EvaluationError } from "../../src/errors/EvaluationError.js";
import { ValidationError } from "../../src/errors/ValidationError.js";
import { Evaluator } from "../../src/evaluator/Evaluator.js";
import { createRollContext } from "../../src/evaluator/RollContext.js";
import { ModifierRegistry } from "../../src/modifiers/ModifierRegistry.js";
import { Parser } from "../../src/parser/Parser.js";
import { DieRegistry } from "../../src/dice/DieRegistry.js";
import { EngineRegistry } from "../../src/random/EngineRegistry.js";
import { NumberGenerator } from "../../src/random/NumberGenerator.js";

const parser = new Parser();

function createEvaluator(rolls: number[] = []) {
  const generator = new NumberGenerator(
    new EngineRegistry().create("mersenne", 7),
  );
  const integer = jest
    .spyOn(generator, "integer")
    .mockImplementation(() => rolls.shift() ?? 1);
  const evaluator = new Evaluator({
    dice: new DieRegistry(),
    modifiers: new ModifierRegistry(),
  });

  return {
    evaluate: (notation: string) =>
      evaluator.evaluate(
        parser.parse(notation),
        createRollContext({ generator }),
      ),
    integer,
  };
}

describe("conditional expressions", () => {
  test.each([
    ["0", 10],
    ["-0", 10],
    ["2", 2],
    ["-2", -2],
    ["1/2", 0.5],
    ["1/0", Infinity],
  ])("uses numeric truthiness for check %s", (check, expected) => {
    const { evaluate } = createEvaluator();

    expect(evaluate(`(${check}) ? ($$condition) : (10)`).value).toBe(expected);
  });

  test("evaluates a shorthand check once and uses its value when truthy", () => {
    const { evaluate, integer } = createEvaluator([3]);
    const result = evaluate("(d6=3) ?: (10)");

    expect(result).toMatchObject({
      type: "conditional",
      value: 1,
      condition: { value: 1 },
      selectedBranch: "true",
      selectedResult: {
        type: "reference",
        node: { type: "reference", namespace: "system", path: ["condition"] },
        value: 1,
      },
    });
    expect(integer).toHaveBeenCalledTimes(1);
  });

  test("evaluates a falsy shorthand's fallback after the check", () => {
    const { evaluate, integer } = createEvaluator([2, 5]);
    const result = evaluate("(d6=3) ?: (d6)");

    expect(result).toMatchObject({
      value: 5,
      condition: { value: 0 },
      selectedBranch: "false",
      selectedResult: { type: "pool", value: 5 },
    });
    expect(integer).toHaveBeenCalledTimes(2);
  });

  test("evaluates only the selected branch", () => {
    const { evaluate, integer } = createEvaluator();
    const trueResult = evaluate("(2) ? ($$condition+3) : (1d(0))");

    expect(trueResult.value).toBe(5);
    expect(integer).not.toHaveBeenCalled();
    expect(() => evaluate("(0) ? (1d(0)) : (10)")).not.toThrow();
    expect(() => evaluate("(0) ? (10) : (1d(0))")).toThrow(ValidationError);
  });

  test("nested checks inherit, shadow, and restore the surrounding binding", () => {
    const { evaluate } = createEvaluator();

    expect(
      evaluate(
        "(2) ? ((($$condition-1) ? ($$condition+10) : (0)) + $$condition) : (0)",
      ).value,
    ).toBe(13);
  });

  test("accepts computed quantities and sides that reference the check", () => {
    const { evaluate, integer } = createEvaluator([2]);
    const result = evaluate("(2) ? ((0+$$condition)d($$condition+1)) : (0)");

    expect(result.value).toBe(3);
    expect(integer).toHaveBeenCalledTimes(2);
  });

  test("allows a zero check binding in calculated quantities", () => {
    const { evaluate, integer } = createEvaluator();
    expect(evaluate("(0) ? (1) : (($$condition)d6)").value).toBe(0);
    expect(integer).not.toHaveBeenCalled();
  });

  test("validates an unselected programmatic branch without constructing its die", () => {
    const factory = jest.fn(() => ({ min: 1, max: 6 }));
    const evaluator = new Evaluator({
      dice: new DieRegistry().register("custom", factory),
      modifiers: new ModifierRegistry(),
    });
    const context = createRollContext();

    expect(
      evaluator.evaluate(conditional(1, 2, pool(1, die("custom"))), context)
        .value,
    ).toBe(2);
    expect(factory).not.toHaveBeenCalled();
    expect(() =>
      evaluator.evaluate(
        conditional(1, 2, { type: "bogus" } as never),
        context,
      ),
    ).toThrow();
  });

  test("rejects out-of-scope programmatic references and preserves math errors", () => {
    const { evaluate } = createEvaluator();
    const evaluator = new Evaluator({
      dice: new DieRegistry(),
      modifiers: new ModifierRegistry(),
    });
    const context = createRollContext();

    expect(() => evaluator.evaluate(conditionReference(), context)).toThrow(
      ValidationError,
    );
    expect(() => evaluate("(sqrt(-1)) ? (1) : (2)")).toThrow(EvaluationError);
    expect(() => evaluate("(2) ? (sqrt(-1)) : (3)")).toThrow(EvaluationError);
  });
});
