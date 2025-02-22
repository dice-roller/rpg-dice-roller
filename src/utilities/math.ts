import { evaluate as mathEval } from 'mathjs';
import { ComparisonOperator } from "../types/Enums/ComparisonOperator";

/**
 * Check if `a` is comparative to `b` with the given operator.
 *
 * @example <caption>Is `a` greater than `b`?</caption>
 * const a = 4;
 * const b = 2;
 *
 * compareNumber(a, b, '>'); // true
 *
 * @example <caption>Is `a` equal to `b`?</caption>
 * const a = 4;
 * const b = 2;
 *
 * compareNumber(a, b, '='); // false
 *
 * @param {number} a The number to compare with `b`
 * @param {number} b The number to compare with `a`
 * @param {string} operator A valid comparative operator: `=, <, >, <=, >=, !=, <>`
 *
 * @returns {boolean} `true` if the comparison matches, `false` otherwise
 */
const compareNumbers = (a: number, b: number, operator: ComparisonOperator): boolean => {
  const aNum = Number(a);
  const bNum = Number(b);

  if (Number.isNaN(aNum) || Number.isNaN(bNum)) {
    return false;
  }

  switch (operator) {
    case ComparisonOperator.Equal:
    case ComparisonOperator.EqualDouble:
      return aNum === bNum;
    case ComparisonOperator.LessThan:
      return aNum < bNum;
    case ComparisonOperator.GreaterThan:
      return aNum > bNum;
    case ComparisonOperator.LessThanOrEqual:
      return aNum <= bNum;
    case ComparisonOperator.GreaterThanOrEqual:
      return aNum >= bNum;
    case ComparisonOperator.NotEqual:
    case ComparisonOperator.NotEqualSimple:
    case ComparisonOperator.NotEqualArrows:
      return aNum !== bNum;
    default:
      return false;
  }
};

/**
 * Evaluate mathematical strings.
 *
 * @example
 * evaluate('5+6'); // 11
 *
 * @param {string} equation The mathematical equation to compute.
 *
 * @returns {number} The result of the equation
 */
const evaluate = (equation: string): number => mathEval(equation) as number;

/**
 * Check if the given value is a valid finite number.
 *
 * @param {*} val
 *
 * @returns {boolean} `true` if it is a finite number, `false` otherwise
 */
const isNumeric = (val: unknown): boolean => {
  if ((typeof val !== 'number') && (typeof val !== 'string')) {
    return false;
  }

  return !Number.isNaN(val) && Number.isFinite(Number(val));
};

/**
 * Check if the given value is a "safe" number.
 *
 * A "safe" number falls within the `Number.MAX_SAFE_INTEGER` and `Number.MIN_SAFE_INTEGER` values
 * (Inclusive).
 *
 * @param {*} val
 *
 * @returns {boolean} `true` if the value is a "safe" number, `false` otherwise
 */
const isSafeNumber = (val: unknown): boolean => {
  if (!isNumeric(val)) {
    return false;
  }

  const castVal = Number(val);

  return (castVal <= Number.MAX_SAFE_INTEGER) && (castVal >= Number.MIN_SAFE_INTEGER);
};

/**
 * Take an array of numbers and add the values together.
 *
 * @param {number[]} numbers
 *
 * @returns {number} The summed value
 */
const sumArray = (numbers: number[]): number => (
  !Array.isArray(numbers)
    ? 0
    : numbers.reduce((prev, current): number => (
      prev + (isNumeric(current) ? parseFloat(`${current}`) : 0)
    ), 0)
);

/**
 * Round a number to the given amount of digits after the decimal point, removing any trailing
 * zeros after the decimal point.
 *
 * @example
 * toFixed(1.236, 2); // 1.24
 * toFixed(30.1, 2); // 30.1
 * toFixed(4.0000000004, 3); // 4
 *
 * @param {number} num The number to round
 * @param {number} [precision=0] The number of digits after the decimal point
 *
 * @returns {number}
 */
const toFixed = (num: number, precision: number = 0): number => (
  // round to precision, then cast to a number to remove trailing zeroes after the decimal point
  parseFloat(parseFloat(`${num}`).toFixed(precision || 0))
);

export {
  compareNumbers,
  evaluate,
  isNumeric,
  isSafeNumber,
  sumArray,
  toFixed,
};
