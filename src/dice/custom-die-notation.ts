import { ValidationError } from "../errors/ValidationError.js";

/** Maximum number of faces materialised from custom-die notation. */
export const MAX_CUSTOM_DIE_FACES = 1000;

/**
 * A custom range either keeps the existing compact range representation or expands to faces.
 */
export type CustomDieRange =
  | { readonly kind: "range"; readonly start: number; readonly end: number }
  | { readonly kind: "faces"; readonly faces: readonly number[] };

const MAX_DECIMAL_PLACES = 4;
const MAX_DECIMAL_TOKEN_LENGTH = 1024;
const CUSTOM_DIE_RANGE_SCALE = 10000;
const MAX_CUSTOM_DIE_RANGE_UNITS = 4503599627370495n;
const MAX_CUSTOM_DIE_RANGE_MAGNITUDE = "450359962737.0495";

/** Formats a finite number as a decimal literal without JavaScript exponent notation. */
export function formatCustomDieNumber(value: number): string {
  if (!Number.isFinite(value)) {
    throw new ValidationError(
      `Custom die values must be finite numbers: ${value}`,
    );
  }

  const notation = String(value);
  const exponentPosition = notation.search(/[eE]/);

  if (exponentPosition === -1) {
    return notation;
  }

  const [mantissa = "", exponentText = "0"] = notation.split(/[eE]/);
  const negative = mantissa.startsWith("-");
  const unsignedMantissa = negative ? mantissa.slice(1) : mantissa;
  const decimalPosition = unsignedMantissa.indexOf(".");
  const digits = unsignedMantissa.replace(".", "");
  const shiftedPosition =
    (decimalPosition === -1 ? unsignedMantissa.length : decimalPosition) +
    Number(exponentText);

  if (shiftedPosition <= 0) {
    return `${negative ? "-" : ""}0.${"0".repeat(-shiftedPosition)}${digits}`;
  }

  if (shiftedPosition >= digits.length) {
    return `${negative ? "-" : ""}${digits}${"0".repeat(shiftedPosition - digits.length)}`;
  }

  return `${negative ? "-" : ""}${digits.slice(0, shiftedPosition)}.${digits.slice(shiftedPosition)}`;
}

/**
 * Validates a list of faces supplied by custom-die notation.
 *
 * Explicit faces are not subject to expanded-range precision or magnitude limits.
 * This notation-specific limit does not apply to programmatic `faceDie()` calls.
 */
export function customDieFaces(
  faces: readonly (number | string)[],
): readonly number[] {
  if (faces.length === 0) {
    throw new ValidationError("A custom die needs at least one face");
  }

  if (faces.length > MAX_CUSTOM_DIE_FACES) {
    throw new ValidationError(
      `A custom die cannot have more than ${MAX_CUSTOM_DIE_FACES} faces`,
    );
  }

  const values = faces.map(Number);

  if (!values.every(Number.isFinite)) {
    throw new ValidationError("Custom die faces must be finite numbers");
  }

  return values;
}

/**
 * Validates and generates a decimal custom range using four-place fixed-point stepping.
 *
 * Expanded bounds and steps allow up to four significant fractional places and an absolute value
 * of 450359962737.0495. They materialise at most 1,000 reachable values. An ascending implicit
 * `+1` range with safe integer bounds stays compact and is exempt from those expanded-range limits.
 * Explicit face lists have their own finite-value and 1,000-face checks, without the range limits.
 * Range tokens are limited to 1,024 characters.
 */
export function customDieRange(
  startToken: string,
  endToken: string,
  stepToken?: string,
): CustomDieRange {
  const start = parseDecimal(startToken, "start");
  const end = parseDecimal(endToken, "end");
  const step = parseDecimal(stepToken ?? "1", "step");

  if (step.scaledValue === 0n) {
    throw new ValidationError("A custom die range step must not be zero");
  }

  if (
    (start.scaledValue < end.scaledValue && step.scaledValue < 0n) ||
    (start.scaledValue > end.scaledValue && step.scaledValue > 0n)
  ) {
    throw new ValidationError(
      "A custom die range step points away from its end",
    );
  }

  if (
    stepToken === undefined &&
    start.fractionalPlaces === 0 &&
    end.fractionalPlaces === 0 &&
    Number.isSafeInteger(start.number) &&
    Number.isSafeInteger(end.number)
  ) {
    return { kind: "range", start: start.number, end: end.number };
  }

  validateRangeMagnitude(start, "start");
  validateRangeMagnitude(end, "end");
  validateRangeMagnitude(step, "step");

  const distance =
    start.scaledValue <= end.scaledValue
      ? end.scaledValue - start.scaledValue
      : start.scaledValue - end.scaledValue;
  const stepSize = step.scaledValue < 0n ? -step.scaledValue : step.scaledValue;
  const count = Number(distance / stepSize + 1n);

  if (count > MAX_CUSTOM_DIE_FACES) {
    throw new ValidationError(
      `A custom die range cannot generate more than ${MAX_CUSTOM_DIE_FACES} faces`,
    );
  }

  const scaledStart = Number(start.scaledValue);
  const scaledStep = Number(step.scaledValue);

  const faces = new Array<number>(count);
  let exactValue = scaledStart;

  for (let index = 0; index < count; index += 1) {
    faces[index] = exactValue / CUSTOM_DIE_RANGE_SCALE;

    if (index + 1 < count) {
      exactValue += scaledStep;
    }
  }

  return { kind: "faces", faces };
}

interface Decimal {
  readonly scaledValue: bigint;
  readonly fractionalPlaces: number;
  readonly number: number;
}

function parseDecimal(token: string, name: string): Decimal {
  if (token.length > MAX_DECIMAL_TOKEN_LENGTH) {
    throw new ValidationError(`Custom die ${name} has too many decimal digits`);
  }

  const match = /^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))$/.exec(token);

  if (!match) {
    throw new ValidationError(
      `Custom die ${name} must be a decimal number: ${token}`,
    );
  }

  const integerPart = match[2] ?? "0";
  const rawFraction = match[3] ?? match[4] ?? "";
  const fraction = rawFraction.replace(/0+$/, "");
  const fractionalPlaces = fraction.length;

  if (fractionalPlaces > MAX_DECIMAL_PLACES) {
    throw new ValidationError(
      `Custom die ${name} cannot have more than ${MAX_DECIMAL_PLACES} decimal places`,
    );
  }

  const sign = match[1] === "-" ? -1n : 1n;
  const number = Number(token);

  if (!Number.isFinite(number)) {
    throw new ValidationError(`Custom die ${name} must be finite: ${token}`);
  }

  const fractionalUnits = fraction.padEnd(MAX_DECIMAL_PLACES, "0");
  const scaledValue =
    sign *
    (BigInt(integerPart) * BigInt(CUSTOM_DIE_RANGE_SCALE) +
      BigInt(fractionalUnits || "0"));

  return { scaledValue, fractionalPlaces, number };
}

function validateRangeMagnitude(decimal: Decimal, name: string): void {
  const magnitude =
    decimal.scaledValue < 0n ? -decimal.scaledValue : decimal.scaledValue;

  if (magnitude > MAX_CUSTOM_DIE_RANGE_UNITS) {
    throw new ValidationError(
      `Custom die range ${name} cannot exceed an absolute value of ${MAX_CUSTOM_DIE_RANGE_MAGNITUDE}`,
    );
  }
}
