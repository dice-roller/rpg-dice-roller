import {
  binary,
  conditionReference,
  conditional,
  compare,
  comparison,
  criticalFailure,
  criticalSuccess,
  die,
  drop,
  explode,
  explodeMatchingBatch,
  fn,
  group,
  keep,
  max,
  min,
  negate,
  num,
  paren,
  pool,
  reference,
  reRoll,
  sort,
  target,
  unique,
} from "../../src/ast/builders.js";
import { DieRegistry } from "../../src/dice/DieRegistry.js";
import { EvaluationError } from "../../src/errors/EvaluationError.js";
import { ValidationError } from "../../src/errors/ValidationError.js";
import { validateExpression } from "../../src/ast/validation.js";
import { Evaluator } from "../../src/evaluator/Evaluator.js";
import { createRollContext } from "../../src/evaluator/RollContext.js";
import { ModifierRegistry } from "../../src/modifiers/ModifierRegistry.js";
import { EngineRegistry } from "../../src/random/EngineRegistry.js";
import { NumberGenerator } from "../../src/random/NumberGenerator.js";

const validModifiers = [
  ["explode", explode()],
  [
    "explode-matching-batch",
    explodeMatchingBatch({ failureComparePoint: compare("=", 1), limit: 2 }),
  ],
  ["re-roll", reRoll()],
  ["unique", unique()],
  [
    "target",
    target([
      { kind: "success", comparePoint: compare(">=", 5) },
      { kind: "failure", comparePoint: compare("<", 2), amount: 2 },
    ]),
  ],
  ["keep", keep("h", 1)],
  ["drop", drop("l", 1)],
  ["sort", sort("a")],
  ["min", min(1)],
  ["max", max(6)],
  ["critical-success", criticalSuccess()],
  ["critical-failure", criticalFailure()],
] as const;

const invalidModifiers: [string, unknown][] = [
  ["non-object", null],
  ["wrong type", { type: "other", name: "keep" }],
  ["explode", { ...explode(), compound: "yes" }],
  ["explode amount", { ...explode(), amount: "two" }],
  ["matching-batch limit", { ...explodeMatchingBatch(), limit: 0 }],
  [
    "matching-batch explosion comparison",
    { ...explodeMatchingBatch(), comparePoint: { operator: "~", value: 1 } },
  ],
  [
    "matching-batch failure comparison",
    {
      ...explodeMatchingBatch(),
      failureComparePoint: { operator: "=", value: Number.POSITIVE_INFINITY },
    },
  ],
  ["re-roll", { ...reRoll(), once: "yes" }],
  ["unique", { ...unique(), limit: "many" }],
  [
    "target rule shape",
    {
      ...target([{ kind: "success", comparePoint: compare(">=", 5) }]),
      rules: [null],
    },
  ],
  [
    "target rule kind",
    {
      ...target([{ kind: "success", comparePoint: compare(">=", 5) }]),
      rules: [{ kind: "other", comparePoint: { operator: ">=", value: 5 } }],
    },
  ],
  [
    "target compare point",
    {
      ...target([{ kind: "success", comparePoint: compare(">=", 5) }]),
      rules: [{ kind: "success", comparePoint: { operator: 1, value: "5" } }],
    },
  ],
  [
    "target rule amount",
    {
      ...target([{ kind: "success", comparePoint: compare(">=", 5) }]),
      rules: [
        {
          kind: "success",
          comparePoint: { operator: ">=", value: 5 },
          amount: "many",
        },
      ],
    },
  ],
  ["keep", { ...keep("h", 1), end: "x" }],
  ["drop", { ...drop("l", 1), qty: "one" }],
  ["sort", { ...sort("a"), direction: "sideways" }],
  ["min", { ...min(1), value: "one" }],
  ["max", { ...max(6), value: "many" }],
  ["critical-success", { ...criticalSuccess(), comparePoint: null }],
  ["critical-failure", { ...criticalFailure(), comparePoint: null }],
];

function poolWithModifier(modifier: unknown) {
  return { ...pool(1, 6), modifiers: [modifier] };
}

describe("expression validation", () => {
  test.each([
    ["number", num(0)],
    ["pool", pool(1, 6)],
    ["described pool", pool(1, 6, { description: "supply" })],
    ["group", group([num(1), pool(1, 4)])],
    [
      "block-described group",
      group([num(1)], { description: { text: "bundle", style: "block" } }),
    ],
    ["binary", binary("+", 1, 2)],
    ["comparison", comparison(">=", 1, 2)],
    ["unary", negate(1)],
    ["parenthesized", paren(1)],
    ["function", fn("abs", -2)],
  ])("accepts a valid %s expression", (_name, node) => {
    expect(() => validateExpression(node)).not.toThrow();
  });

  test("validates nested bindings and expression-valued pool parameters", () => {
    const node = conditional(
      1,
      pool(conditionReference(), die("standard", conditionReference())),
      conditional(conditionReference(), null, conditionReference()),
    );

    expect(() => validateExpression(node)).not.toThrow();
  });

  test("accepts references without checking whether their bindings are available", () => {
    expect(() => validateExpression(conditionReference())).not.toThrow();
    expect(() =>
      validateExpression(reference("system", "unknown")),
    ).not.toThrow();
    expect(() =>
      validateExpression(reference("data", "character", "level")),
    ).not.toThrow();
    expect(() => validateExpression(reference("system", "data"))).not.toThrow();
  });

  test.each([
    ["namespace", { type: "reference", namespace: "other", path: ["value"] }],
    ["empty path", { type: "reference", namespace: "system", path: [] }],
    ["empty segment", { type: "reference", namespace: "data", path: [""] }],
    [
      "invalid segment",
      { type: "reference", namespace: "system", path: ["has-dash"] },
    ],
    ["non-array path", { type: "reference", namespace: "data", path: "value" }],
  ] as [string, unknown][])(
    "rejects a reference with an invalid %s",
    (_name, node) => {
      expect(() => validateExpression(node)).toThrow(ValidationError);
    },
  );

  test("rejects obsolete condition reference nodes", () => {
    expect(() => validateExpression({ type: "condition-reference" })).toThrow(
      "Unknown expression node type: condition-reference",
    );
  });

  test.each([
    ["null", null, "Expected an expression node"],
    ["a primitive", 4, "Expected an expression node"],
    [
      "a malformed number",
      { type: "number", value: "4" },
      "A number node must contain a numeric value",
    ],
    [
      "a missing pool die",
      { ...pool(1, 6), die: null },
      "A pool must contain a valid die node",
    ],
    [
      "a die with a missing argument list",
      { ...pool(1, 6), die: { type: "die", name: "standard", args: null } },
      "A pool must contain a valid die node",
    ],
    [
      "a die with an invalid name",
      { ...pool(1, 6), die: { type: "die", name: 6, args: [] } },
      "A pool must contain a valid die node",
    ],
    [
      "a malformed die argument",
      { ...pool(1, 6), die: { type: "die", name: "standard", args: [null] } },
      "Expected an expression node",
    ],
    [
      "a non-list pool modifier field",
      { ...pool(1, 6), modifiers: null },
      "A pool's modifiers must be a list",
    ],
    [
      "a malformed pool description",
      { ...pool(1, 6), description: { text: 4, style: "inline" } },
      "Invalid description node",
    ],
    [
      "a null pool description",
      { ...pool(1, 6), description: null },
      "Invalid description node",
    ],
    [
      "an empty group",
      { type: "group", expressions: [], modifiers: [] },
      "A group must contain at least one expression",
    ],
    [
      "a non-list group expression field",
      { type: "group", expressions: null, modifiers: [] },
      "A group must contain at least one expression",
    ],
    [
      "a non-list group modifier field",
      { ...group([1]), modifiers: null },
      "A group's modifiers must be a list",
    ],
    [
      "a malformed group description",
      { ...group([1]), description: { text: "note", style: "unknown" } },
      "Invalid description node",
    ],
    [
      "a binary node with a missing operand",
      { type: "binary", op: "+", left: null, right: num(1) },
      "Expected an expression node",
    ],
    [
      "a comparison node with a missing operand",
      { type: "comparison", op: "=", left: null, right: num(1) },
      "Expected an expression node",
    ],
    [
      "a unary node with a missing operand",
      { type: "unary", op: "-", operand: undefined },
      "Expected an expression node",
    ],
    [
      "a parenthesis without an expression",
      { type: "paren" },
      "Expected an expression node",
    ],
    [
      "a conditional without a false branch",
      {
        type: "conditional",
        condition: num(1),
        trueBranch: null,
        falseBranch: undefined,
      },
      "A conditional expression requires a false branch",
    ],
  ] as [string, unknown, string][])(
    "rejects %s with its validation error",
    (_name, node, message) => {
      expect(() => validateExpression(node)).toThrow(
        new ValidationError(message),
      );
    },
  );

  test.each([
    [
      "binary",
      { type: "binary", op: "**", left: num(1), right: num(2) },
      "A binary node must contain a valid operator",
    ],
    [
      "comparison",
      { type: "comparison", op: "~", left: num(1), right: num(2) },
      "A comparison node must contain a valid operator",
    ],
    [
      "unary",
      { type: "unary", op: "+", operand: num(1) },
      "A unary node must contain a valid operator",
    ],
    [
      "function name",
      { type: "function", name: "unknown", args: [num(1)] },
      "A function node must contain a valid name and argument list",
    ],
    [
      "function argument list",
      { type: "function", name: "abs", args: null },
      "A function node must contain a valid name and argument list",
    ],
    [
      "unknown expression type",
      { type: "unsupported" },
      "Unknown expression node type: unsupported",
    ],
  ] as [string, unknown, string][])(
    "rejects an invalid %s operator or type",
    (_name, node, message) => {
      expect(() => validateExpression(node)).toThrow(
        new EvaluationError(message),
      );
    },
  );

  test.each(validModifiers)(
    "accepts a well-formed %s modifier",
    (_name, modifier) => {
      expect(() =>
        validateExpression(pool(1, 6, { modifiers: [modifier] })),
      ).not.toThrow();
    },
  );

  test("normalizes valid explicit modifier limits and amounts through builders", () => {
    expect(explode({ limit: 2, amount: 3 })).toMatchObject({
      limit: 2,
      amount: 3,
    });
    expect(reRoll({ once: true, limit: 1 })).not.toHaveProperty("limit");
    expect(unique({ once: true, limit: 1 })).not.toHaveProperty("limit");
  });

  test.each([
    [
      "a zero limit",
      () => explode({ limit: 0 }),
      "A modifier limit must be a positive safe integer",
    ],
    [
      "an unsafe limit",
      () => unique({ limit: Number.MAX_SAFE_INTEGER + 1 }),
      "A modifier limit must be a positive safe integer",
    ],
    [
      "a non-once limit on a once modifier",
      () => reRoll({ once: true, limit: 2 }),
      "A once modifier cannot have a limit other than 1",
    ],
    [
      "a zero amount",
      () => explode({ amount: 0 }),
      "A modifier amount must be a positive safe integer",
    ],
    [
      "a fractional amount",
      () => reRoll({ amount: 1.5 }),
      "A modifier amount must be a positive safe integer",
    ],
  ] as [string, () => unknown, string][])(
    "rejects %s",
    (_name, makeModifier, message) => {
      expect(makeModifier).toThrow(new ValidationError(message));
    },
  );

  test.each(invalidModifiers)(
    "rejects a malformed %s modifier",
    (_name, modifier) => {
      expect(() =>
        validateExpression(poolWithModifier(modifier) as never),
      ).toThrow(new ValidationError("Invalid modifier node"));
    },
  );

  test("validates a skipped branch without rolling dice or invoking modifiers", () => {
    const generator = new NumberGenerator(
      new EngineRegistry().create("mersenne", 7),
    );
    const integer = jest.spyOn(generator, "integer");
    const dice = new DieRegistry();
    const createDie = jest.spyOn(dice, "create");
    const modifiers = new ModifierRegistry();
    const applyModifiers = jest.spyOn(modifiers, "inExecutionOrder");
    const evaluator = new Evaluator({ dice, modifiers });

    const result = evaluator.evaluate(
      conditional(1, 7, pool(1, 6, { modifiers: [keep("h")] })),
      createRollContext({ generator }),
    );

    expect(result).toMatchObject({ value: 7, selectedBranch: "true" });
    expect(integer).not.toHaveBeenCalled();
    expect(createDie).not.toHaveBeenCalled();
    expect(applyModifiers).not.toHaveBeenCalled();
  });

  test("rejects a malformed skipped branch before rolling or invoking modifiers", () => {
    const generator = new NumberGenerator(
      new EngineRegistry().create("mersenne", 7),
    );
    const integer = jest.spyOn(generator, "integer");
    const dice = new DieRegistry();
    const createDie = jest.spyOn(dice, "create");
    const modifiers = new ModifierRegistry();
    const applyModifiers = jest.spyOn(modifiers, "inExecutionOrder");
    const evaluator = new Evaluator({ dice, modifiers });
    const malformedPool = poolWithModifier({ type: "modifier", name: "keep" });

    expect(() =>
      evaluator.evaluate(
        conditional(1, 7, malformedPool as never),
        createRollContext({ generator }),
      ),
    ).toThrow(new ValidationError("Invalid modifier node"));
    expect(integer).not.toHaveBeenCalled();
    expect(createDie).not.toHaveBeenCalled();
    expect(applyModifiers).not.toHaveBeenCalled();
  });
});
