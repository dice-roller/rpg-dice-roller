import { ValidationError } from "../errors/ValidationError.js";

export function isPositiveSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export function normalizeModifierLimit(
  limit: unknown,
  once = false,
): number | undefined {
  if (limit === undefined) {
    return undefined;
  }

  if (!isPositiveSafeInteger(limit)) {
    throw new ValidationError(
      "A modifier limit must be a positive safe integer",
    );
  }

  if (once) {
    if (limit !== 1) {
      throw new ValidationError(
        "A once modifier cannot have a limit other than 1",
      );
    }

    return undefined;
  }

  return limit;
}
