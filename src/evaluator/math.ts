/**
 * The maths used by the evaluator: a lookup table onto a private, tree-shaken mathjs instance.
 *
 * Only the functions listed here are bundled, and the global mathjs config is never changed. The
 * results match v5's `mathjs.evaluate()`, e.g. floored modulo (`5 % -3 = -1`), `round()` half away
 * from zero (`round(-2.5) = -3`) and `floor()` / `ceil()` snapping near-integers.
 *
 * `predictable: true` makes mathjs return `NaN` instead of complex numbers (`sqrt(-4)`, `log(-1)`),
 * which is thrown as an `EvaluationError`. `Infinity` (e.g. `1/0`) is a valid result.
 *
 * Operator precedence is handled by the grammar, not here.
 */
import {
  absDependencies,
  addDependencies,
  ceilDependencies,
  cosDependencies,
  create,
  divideDependencies,
  expDependencies,
  floorDependencies,
  logDependencies,
  maxDependencies,
  minDependencies,
  modDependencies,
  multiplyDependencies,
  powDependencies,
  roundDependencies,
  signDependencies,
  sinDependencies,
  sqrtDependencies,
  subtractDependencies,
  tanDependencies,
  unaryMinusDependencies,
} from "mathjs";
import type { BinaryOperator, MathFunctionName } from "../ast/nodes.js";
import { EvaluationError } from "../errors/EvaluationError.js";

const math = create(
  {
    absDependencies,
    addDependencies,
    ceilDependencies,
    cosDependencies,
    divideDependencies,
    expDependencies,
    floorDependencies,
    logDependencies,
    maxDependencies,
    minDependencies,
    modDependencies,
    multiplyDependencies,
    powDependencies,
    roundDependencies,
    signDependencies,
    sinDependencies,
    sqrtDependencies,
    subtractDependencies,
    tanDependencies,
    unaryMinusDependencies,
  },
  { predictable: true },
);

/** A maths function on plain numbers. */
export type NumberFn = (...args: number[]) => number;

/** The mathjs functions in the private instance. */
type MathName =
  | "abs"
  | "add"
  | "ceil"
  | "cos"
  | "divide"
  | "exp"
  | "floor"
  | "log"
  | "max"
  | "min"
  | "mod"
  | "multiply"
  | "pow"
  | "round"
  | "sign"
  | "sin"
  | "sqrt"
  | "subtract"
  | "tan"
  | "unaryMinus";

/**
 * Calls a mathjs function, only accepting real-number results.
 *
 * mathjs's typed functions are overloaded for many types, so they are called as plain functions of
 * numbers here.
 */
const real =
  (name: MathName): NumberFn =>
  (...args) => {
    const value: unknown = (
      math[name] as unknown as (...args: number[]) => unknown
    )(...args);

    if (typeof value !== "number" || Number.isNaN(value)) {
      throw new EvaluationError(
        `${name}(${args.join(", ")}) has no real result`,
      );
    }

    return value;
  };

/** The binary operators. */
export const operators: Readonly<
  Record<BinaryOperator, (a: number, b: number) => number>
> = Object.freeze({
  "+": real("add"),
  "-": real("subtract"),
  "*": real("multiply"),
  "/": real("divide"),
  "%": real("mod"),
  "^": real("pow"),
});

/** Unary minus. */
export const negate: (x: number) => number = real("unaryMinus");

/** The maths functions. */
export const functions: Readonly<Record<MathFunctionName, NumberFn>> =
  Object.freeze({
    abs: real("abs"),
    ceil: real("ceil"),
    cos: real("cos"),
    exp: real("exp"),
    floor: real("floor"),
    log: real("log"),
    round: real("round"),
    sign: real("sign"),
    sin: real("sin"),
    sqrt: real("sqrt"),
    tan: real("tan"),
    pow: real("pow"),
    max: real("max"),
    min: real("min"),
  });
