import {
  BINARY_OPERATORS,
  COMPARE_OPERATORS,
  MATH_FUNCTION_NAMES,
} from "../ast/nodes.js";
import type {
  ComparePoint,
  ExpressionNode,
  ModifierNode,
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
  "comparison",
  "unary",
  "paren",
  "function",
  "conditional",
  "reference",
] as const;

function result(value: unknown, path: string): ExpressionResult {
  const data = record(value, path);
  const type = oneOf(data.type, RESULT_TYPES, `${path}.type`);

  number(data.value, `${path}.value`);
  const node = expression(data.node, `${path}.node`);

  if (node.type !== type) {
    fail(`${path}.node`, `expected a ${type} node`);
  }

  switch (node.type) {
    case "number":
    case "reference":
      break;
    case "pool":
      result(data.qty, `${path}.qty`);
      each(data.dieArgs, `${path}.dieArgs`, (item, itemPath) =>
        result(item, itemPath),
      );
      dieSnapshot(data.die, `${path}.die`);
      each(data.rolls, `${path}.rolls`, dieResult);
      modifierArguments(data.modifierArguments, node.modifiers, path);
      break;
    case "group":
      each(data.members, `${path}.members`, (item, itemPath) =>
        groupMember(item, itemPath),
      );
      modifierArguments(data.modifierArguments, node.modifiers, path);
      break;
    case "binary":
    case "comparison":
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
      each(data.args, `${path}.args`, (item, itemPath) =>
        result(item, itemPath),
      );
      break;
    case "conditional":
      result(data.condition, `${path}.condition`);
      oneOf(
        data.selectedBranch,
        ["true", "false"] as const,
        `${path}.selectedBranch`,
      );
      result(data.selectedResult, `${path}.selectedResult`);
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

function modifierArguments(
  value: unknown,
  modifiers: readonly ModifierNode[],
  path: string,
): void {
  const computedIndexes = new Set<number>();

  modifiers.forEach((modifier, index) => {
    if (
      (modifier.name === "keep" || modifier.name === "drop") &&
      typeof modifier.qty !== "number"
    ) {
      computedIndexes.add(index);
    }
  });

  const argumentPath = `${path}.modifierArguments`;

  if (value === undefined) {
    if (computedIndexes.size > 0) {
      fail(argumentPath, "missing computed modifier arguments");
    }
    return;
  }

  if (computedIndexes.size === 0) {
    fail(argumentPath, "no computed modifier quantities to associate");
  }

  const entries = list(value, argumentPath);

  if (entries.length !== computedIndexes.size) {
    fail(argumentPath, "expected one result for each computed modifier");
  }

  const seenIndexes = new Set<number>();

  each(entries, argumentPath, (value, entryPath) => {
    const entry = record(value, entryPath);
    const modifierIndex = number(
      entry.modifierIndex,
      `${entryPath}.modifierIndex`,
    );

    if (!Number.isSafeInteger(modifierIndex) || modifierIndex < 0) {
      fail(
        `${entryPath}.modifierIndex`,
        "expected a non-negative safe integer",
      );
    }

    if (!computedIndexes.has(modifierIndex)) {
      fail(
        `${entryPath}.modifierIndex`,
        "doesn't reference a computed modifier",
      );
    }

    if (seenIndexes.has(modifierIndex)) {
      fail(`${entryPath}.modifierIndex`, "duplicate modifier argument result");
    }

    const modifier = modifiers[modifierIndex];
    if (
      modifier === undefined ||
      (modifier.name !== "keep" && modifier.name !== "drop") ||
      typeof modifier.qty === "number"
    ) {
      fail(
        `${entryPath}.modifierIndex`,
        "doesn't reference a computed modifier",
      );
    }

    const argument = result(entry.result, `${entryPath}.result`);

    if (!Number.isSafeInteger(argument.value) || argument.value < 0) {
      fail(`${entryPath}.result.value`, "expected a non-negative safe integer");
    }

    if (!sameStructure(argument.node, modifier.qty)) {
      fail(
        `${entryPath}.result.node`,
        "doesn't match its source modifier quantity",
      );
    }

    seenIndexes.add(modifierIndex);
  });
}

function sameStructure(left: unknown, right: unknown): boolean {
  if (left === right) {
    return true;
  }

  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((item, index) => sameStructure(item, right[index]))
    );
  }

  if (
    typeof left !== "object" ||
    left === null ||
    typeof right !== "object" ||
    right === null
  ) {
    return false;
  }

  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();

  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      (key, index) =>
        key === rightKeys[index] &&
        sameStructure(
          (left as Record<string, unknown>)[key],
          (right as Record<string, unknown>)[key],
        ),
    )
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
    case "reference":
      referenceNode(node, path);
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

      each(node.expressions, `${path}.expressions`, (item, itemPath) =>
        expression(item, itemPath),
      );
      modifiers(node.modifiers, `${path}.modifiers`);
      optional(node.description, `${path}.description`, description);
      break;
    case "binary":
      oneOf(node.op, BINARY_OPERATORS, `${path}.op`);
      expression(node.left, `${path}.left`);
      expression(node.right, `${path}.right`);
      break;
    case "comparison":
      oneOf(node.op, COMPARE_OPERATORS, `${path}.op`);
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
      each(node.args, `${path}.args`, (item, itemPath) =>
        expression(item, itemPath),
      );
      break;
    case "conditional":
      expression(node.condition, `${path}.condition`);
      if (node.trueBranch !== null) {
        expression(node.trueBranch, `${path}.trueBranch`);
      }
      expression(node.falseBranch, `${path}.falseBranch`);
      break;
  }

  return node as unknown as ExpressionNode;
}

function referenceNode(node: Data, path: string): void {
  oneOf(node.namespace, ["system", "data"] as const, `${path}.namespace`);
  const segments = list(node.path, `${path}.path`);

  if (segments.length === 0) {
    fail(`${path}.path`, "a reference needs at least one path segment");
  }

  each(segments, `${path}.path`, (segment, segmentPath) => {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(string(segment, segmentPath))) {
      fail(segmentPath, "expected an identifier path segment");
    }
  });
}

function dieNode(value: unknown, path: string): void {
  const node = record(value, path);

  oneOf(node.type, ["die"] as const, `${path}.type`);

  if (string(node.name, `${path}.name`) === "") {
    fail(`${path}.name`, "a die needs a name");
  }

  each(node.args, `${path}.args`, (item, itemPath) =>
    expression(item, itemPath),
  );
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
  "explode-matching-batch",
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
      optional(node.amount, `${path}.amount`, positiveSafeInteger);
      break;
    case "explode-matching-batch":
      optional(node.comparePoint, `${path}.comparePoint`, comparePoint);
      optional(
        node.failureComparePoint,
        `${path}.failureComparePoint`,
        comparePoint,
      );
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

      if (typeof node.qty === "number") {
        if (!Number.isSafeInteger(node.qty) || node.qty < 1) {
          fail(`${path}.qty`, "expected a positive integer");
        }
      } else {
        expression(node.qty, `${path}.qty`);
      }
      break;
    case "re-roll":
    case "unique":
      boolean(node.once, `${path}.once`);
      optional(node.comparePoint, `${path}.comparePoint`, comparePoint);
      optional(node.limit, `${path}.limit`, positiveSafeInteger);

      if (node.name === "unique" && node.amount !== undefined) {
        fail(`${path}.amount`, "amount is not supported on unique modifiers");
      }

      if (node.name === "re-roll") {
        optional(node.amount, `${path}.amount`, positiveSafeInteger);
      }

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
