import {
  BINARY_OPERATORS,
  COMPARE_OPERATORS,
  MATH_FUNCTION_NAMES,
} from "../ast/nodes.js";
import type {
  ComparePoint,
  ExpressionNode,
  ModifierName,
} from "../ast/nodes.js";
import { isPositiveSafeInteger } from "../ast/validation.js";
import { ImportError } from "../errors/ImportError.js";
import { RESULT_FLAGS } from "../results/flags.js";
import type { ExpressionResult } from "../results/types.js";
import { DATA_VERSION, NON_FINITE_NUMBERS } from "./formats.js";
import type {
  EncodedExportData,
  ExportData,
  HistoryData,
  NonFiniteNumber,
  RollData,
} from "./formats.js";

/**
 * Decodes imported data: an object, a JSON string, or a base64-encoded (UTF-8) JSON string.
 *
 * Tagged numbers (`{ "$number": "Infinity" }`) are turned back into numbers in a copy of the
 * input. The export, result and expression structures are validated, but stored totals and
 * results are not recalculated or checked for consistency. Nothing is rolled.
 *
 * Dice need no restoring: pools refer to their die by factory name (`DieNode`), and the stored
 * results already contain the dice values. Re-evaluating the expression requires the die factory.
 *
 * @throws {ImportError} the data is malformed, or has an unknown `type` or `version`
 */
export function decode(input: string | EncodedExportData): ExportData {
  const data: unknown = typeof input === "string" ? parse(input) : input;

  return exportData(hydrate(data), "data");
}

/* ------------------------------------------------------------------------------------------------
 * Parsing
 * --------------------------------------------------------------------------------------------- */

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

function parse(input: string): unknown {
  const text = input.trim();

  if (text === "") {
    throw new ImportError("Can't import an empty string");
  }

  return parseJson(text.startsWith("{") ? text : fromBase64(text));
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new ImportError("The data isn't valid JSON", { cause: error });
  }
}

/** Decodes base64, then UTF-8. */
function fromBase64(text: string): string {
  if (text.length % 4 !== 0 || !BASE64.test(text)) {
    throw new ImportError("The data isn't valid JSON or base64");
  }

  try {
    const binary = atob(text);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (error) {
    throw new ImportError("The base64 data isn't valid UTF-8", {
      cause: error,
    });
  }
}

/* ------------------------------------------------------------------------------------------------
 * Tagged numbers
 * --------------------------------------------------------------------------------------------- */

/** Whether the value is exactly a number tag, e.g. `{ "$number": "Infinity" }`. */
function isNumberTag(value: object): value is { $number: NonFiniteNumber } {
  const keys = Object.keys(value);
  const tag: unknown = (value as { $number?: unknown }).$number;

  return (
    keys.length === 1 &&
    keys[0] === "$number" &&
    typeof tag === "string" &&
    Object.hasOwn(NON_FINITE_NUMBERS, tag)
  );
}

/**
 * Copies the data with number tags turned back into numbers.
 *
 * Anything else is copied as it is; an invalid tag stays an object, and is rejected by the
 * validation where a number is expected.
 */
function hydrate(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(hydrate);
  }

  if (typeof value === "object" && value !== null) {
    if (isNumberTag(value)) {
      return NON_FINITE_NUMBERS[value.$number];
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, property]) => [key, hydrate(property)]),
    );
  }

  return value;
}

/* ------------------------------------------------------------------------------------------------
 * Validation
 *
 * Each validator checks a hydrated value and returns it typed. `path` is used in error messages,
 * e.g. `data.rolls[0].result.node`.
 * --------------------------------------------------------------------------------------------- */

type Data = Readonly<Record<string, unknown>>;

function fail(path: string, message: string): never {
  throw new ImportError(`Invalid import data at ${path}: ${message}`);
}

function record(value: unknown, path: string): Data {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(path, "expected an object");
  }

  return value as Data;
}

function list(value: unknown, path: string): readonly unknown[] {
  if (!Array.isArray(value)) {
    fail(path, "expected an array");
  }

  return value;
}

function string(value: unknown, path: string): string {
  if (typeof value !== "string") {
    fail(path, "expected a string");
  }

  return value;
}

function boolean(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") {
    fail(path, "expected a boolean");
  }

  return value;
}

/** Any number, including `Infinity` / `NaN` (e.g. totals). */
function number(value: unknown, path: string): number {
  if (typeof value !== "number") {
    fail(path, "expected a number");
  }

  return value;
}

/** A finite number (e.g. a literal in the notation). */
function finite(value: unknown, path: string): number {
  if (!Number.isFinite(number(value, path))) {
    fail(path, "expected a finite number");
  }

  return value as number;
}

function positiveSafeInteger(value: unknown, path: string): void {
  if (!isPositiveSafeInteger(value)) {
    fail(path, "expected a positive safe integer");
  }
}

function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  path: string,
): T {
  if (!(allowed as readonly unknown[]).includes(value)) {
    fail(path, `expected one of ${allowed.join(", ")}`);
  }

  return value as T;
}

function each(
  value: unknown,
  path: string,
  validate: (item: unknown, path: string) => unknown,
): void {
  list(value, path).forEach((item, index) => {
    validate(item, `${path}[${index}]`);
  });
}

function optional(
  value: unknown,
  path: string,
  validate: (item: unknown, path: string) => unknown,
): void {
  if (value !== undefined) {
    validate(value, path);
  }
}

/* --- export data -------------------------------------------------------------------------- */

function exportData(value: unknown, path: string): ExportData {
  const data = record(value, path);
  const type = oneOf(data.type, ["roll", "history"] as const, `${path}.type`);

  return type === "roll" ? rollData(data, path) : historyData(data, path);
}

function version(data: Data, path: string): void {
  if (data.version !== DATA_VERSION) {
    fail(
      `${path}.version`,
      `unsupported version ${String(data.version)} (expected ${DATA_VERSION})`,
    );
  }
}

function rollData(value: unknown, path: string): RollData {
  const data = record(value, path);

  oneOf(data.type, ["roll"] as const, `${path}.type`);
  version(data, path);
  string(data.notation, `${path}.notation`);
  result(data.result, `${path}.result`);

  for (const total of ["total", "minTotal", "maxTotal", "averageTotal"]) {
    number(data[total], `${path}.${total}`);
  }

  return data as unknown as RollData;
}

function historyData(data: Data, path: string): HistoryData {
  version(data, path);
  each(data.rolls, `${path}.rolls`, rollData);
  number(data.total, `${path}.total`);

  return data as unknown as HistoryData;
}

/* --- results ------------------------------------------------------------------------------ */

const RESULT_TYPES = [
  "number",
  "pool",
  "group",
  "binary",
  "unary",
  "paren",
  "function",
] as const;

function result(value: unknown, path: string): ExpressionResult {
  const data = record(value, path);
  const type = oneOf(data.type, RESULT_TYPES, `${path}.type`);

  number(data.value, `${path}.value`);

  if (expression(data.node, `${path}.node`).type !== type) {
    fail(`${path}.node`, `expected a ${type} node`);
  }

  switch (type) {
    case "number":
      break;
    case "pool":
      result(data.qty, `${path}.qty`);
      each(data.dieArgs, `${path}.dieArgs`, result);
      dieSnapshot(data.die, `${path}.die`);
      each(data.rolls, `${path}.rolls`, dieResult);
      break;
    case "group":
      each(data.members, `${path}.members`, groupMember);
      break;
    case "binary":
      result(data.left, `${path}.left`);
      result(data.right, `${path}.right`);
      break;
    case "unary":
      result(data.operand, `${path}.operand`);
      break;
    case "paren":
      result(data.inner, `${path}.inner`);
      break;
    case "function":
      each(data.args, `${path}.args`, result);
      break;
  }

  return data as unknown as ExpressionResult;
}

function scoredItem(data: Data, path: string): void {
  number(data.value, `${path}.value`);
  number(data.calculationValue, `${path}.calculationValue`);
  boolean(data.useInTotal, `${path}.useInTotal`);
  each(data.flags, `${path}.flags`, (flag, flagPath) =>
    oneOf(flag, RESULT_FLAGS, flagPath),
  );
}

function dieResult(value: unknown, path: string): void {
  const data = record(value, path);

  oneOf(data.type, ["die"] as const, `${path}.type`);
  number(data.initialValue, `${path}.initialValue`);
  scoredItem(data, path);
}

function groupMember(value: unknown, path: string): void {
  const data = record(value, path);

  oneOf(data.type, ["group-member"] as const, `${path}.type`);
  result(data.result, `${path}.result`);
  scoredItem(data, path);
}

function dieSnapshot(value: unknown, path: string): void {
  const data = record(value, path);

  string(data.notation, `${path}.notation`);

  for (const key of ["min", "max", "average", "faceCount"]) {
    number(data[key], `${path}.${key}`);
  }
}

/* --- AST ---------------------------------------------------------------------------------- */

function expression(value: unknown, path: string): ExpressionNode {
  const node = record(value, path);

  switch (oneOf(node.type, RESULT_TYPES, `${path}.type`)) {
    case "number":
      finite(node.value, `${path}.value`);
      break;
    case "pool":
      expression(node.qty, `${path}.qty`);
      dieNode(node.die, `${path}.die`);
      modifiers(node.modifiers, `${path}.modifiers`);
      optional(node.description, `${path}.description`, description);
      break;
    case "group":
      if (list(node.expressions, `${path}.expressions`).length === 0) {
        fail(`${path}.expressions`, "a group needs at least one expression");
      }

      each(node.expressions, `${path}.expressions`, expression);
      modifiers(node.modifiers, `${path}.modifiers`);
      optional(node.description, `${path}.description`, description);
      break;
    case "binary":
      oneOf(node.op, BINARY_OPERATORS, `${path}.op`);
      expression(node.left, `${path}.left`);
      expression(node.right, `${path}.right`);
      break;
    case "unary":
      oneOf(node.op, ["-"] as const, `${path}.op`);
      expression(node.operand, `${path}.operand`);
      break;
    case "paren":
      expression(node.expression, `${path}.expression`);
      break;
    case "function":
      oneOf(node.name, MATH_FUNCTION_NAMES, `${path}.name`);
      each(node.args, `${path}.args`, expression);
      break;
  }

  return node as unknown as ExpressionNode;
}

function dieNode(value: unknown, path: string): void {
  const node = record(value, path);

  oneOf(node.type, ["die"] as const, `${path}.type`);

  if (string(node.name, `${path}.name`) === "") {
    fail(`${path}.name`, "a die needs a name");
  }

  each(node.args, `${path}.args`, expression);
}

function description(value: unknown, path: string): void {
  const node = record(value, path);

  string(node.text, `${path}.text`);
  oneOf(node.style, ["inline", "block"] as const, `${path}.style`);
}

function comparePoint(value: unknown, path: string): ComparePoint {
  const point = record(value, path);

  oneOf(point.operator, COMPARE_OPERATORS, `${path}.operator`);
  finite(point.value, `${path}.value`);

  return point as unknown as ComparePoint;
}

const MODIFIER_NAMES: readonly ModifierName[] = [
  "explode",
  "target",
  "drop",
  "keep",
  "re-roll",
  "unique",
  "critical-success",
  "critical-failure",
  "sort",
  "max",
  "min",
];

function modifiers(value: unknown, path: string): void {
  const nodes = list(value, path);
  each(nodes, path, modifier);
  if (nodes.filter((node) => (node as Data).name === "target").length > 1) {
    fail(path, "target rules must be in one modifier");
  }
}

function modifier(value: unknown, path: string): void {
  const node = record(value, path);

  oneOf(node.type, ["modifier"] as const, `${path}.type`);

  switch (oneOf(node.name, MODIFIER_NAMES, `${path}.name`)) {
    case "explode":
      boolean(node.compound, `${path}.compound`);
      boolean(node.penetrate, `${path}.penetrate`);
      optional(node.comparePoint, `${path}.comparePoint`, comparePoint);
      optional(node.limit, `${path}.limit`, positiveSafeInteger);
      break;
    case "target": {
      if (node.rules === undefined) {
        const success = comparePoint(node.success, `${path}.success`);
        const failure =
          node.failure === undefined
            ? undefined
            : comparePoint(node.failure, `${path}.failure`);
        const mutable = node as Record<string, unknown>;
        mutable.rules = [
          { kind: "success", comparePoint: success },
          ...(failure ? [{ kind: "failure", comparePoint: failure }] : []),
        ];
        delete mutable.success;
        delete mutable.failure;
      }

      const rules = list(node.rules, `${path}.rules`);
      if (rules.length === 0) {
        fail(`${path}.rules`, "expected at least one rule");
      }

      each(rules, `${path}.rules`, (value, rulePath) => {
        const rule = record(value, rulePath);
        oneOf(rule.kind, ["success", "failure"] as const, `${rulePath}.kind`);
        comparePoint(rule.comparePoint, `${rulePath}.comparePoint`);

        if (rule.amount !== undefined) {
          const amount = finite(rule.amount, `${rulePath}.amount`);
          if (!Number.isInteger(amount) || amount < 1 || amount > 10) {
            fail(`${rulePath}.amount`, "expected an integer between 1 and 10");
          }
        }
      });
      break;
    }
    case "drop":
    case "keep":
      oneOf(node.end, ["h", "l"] as const, `${path}.end`);

      if (
        !Number.isSafeInteger(finite(node.qty, `${path}.qty`)) ||
        (node.qty as number) < 1
      ) {
        fail(`${path}.qty`, "expected a positive integer");
      }
      break;
    case "re-roll":
    case "unique":
      boolean(node.once, `${path}.once`);
      optional(node.comparePoint, `${path}.comparePoint`, comparePoint);
      optional(node.limit, `${path}.limit`, positiveSafeInteger);

      if (node.once && node.limit !== undefined && node.limit !== 1) {
        fail(`${path}.limit`, "a once modifier can only have a limit of 1");
      }
      break;
    case "critical-success":
    case "critical-failure":
      optional(node.comparePoint, `${path}.comparePoint`, comparePoint);
      break;
    case "sort":
      oneOf(node.direction, ["a", "d"] as const, `${path}.direction`);
      break;
    case "max":
    case "min":
      finite(node.value, `${path}.value`);
      break;
  }
}
