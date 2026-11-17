import { ValidationError } from "../errors/ValidationError.js";
import type { ReferenceNamespace } from "../ast/nodes.js";

/** Caller-provided nested data accepted by a roll. */
export interface RollInputData {
  readonly [key: string]: number | boolean | RollInputData;
}

const unsafeSegments = new Set(["__proto__", "prototype", "constructor"]);

/** Validates and deeply copies roll data without reading accessors or inherited properties. */
export function snapshotRollInputData(value: unknown): RollInputData {
  if (!isPlainObject(value)) {
    throw invalidData();
  }

  const ancestors = new Set<object>();

  try {
    return copyObject(value, ancestors);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw invalidData();
  }
}

/** Resolves a reference using own data properties only. */
export function resolveReference(
  namespace: ReferenceNamespace,
  path: readonly string[],
  system: Readonly<Record<string, unknown>>,
  data: RollInputData,
): number {
  const notation = `${namespace === "data" ? "$" : "$$"}${path.join(".")}`;
  let value: unknown = namespace === "data" ? data : system;

  for (const [index, segment] of path.entries()) {
    if (unsafeSegments.has(segment)) {
      throw new ValidationError(
        `Cannot resolve ${notation}: "${segment}" is a reserved path segment`,
      );
    }

    if (typeof value !== "object" || value === null) {
      throw new ValidationError(
        `Cannot resolve ${notation}: "${path.slice(0, index).join(".")}" is not an object`,
      );
    }

    let descriptor: PropertyDescriptor | undefined;

    try {
      descriptor = Object.getOwnPropertyDescriptor(value, segment);
    } catch {
      throw new ValidationError(`Cannot safely resolve ${notation}`);
    }

    if (descriptor === undefined) {
      throw new ValidationError(
        `Cannot resolve ${notation}: no data binding exists`,
      );
    }

    if (!("value" in descriptor)) {
      throw new ValidationError(
        `Cannot resolve ${notation}: accessors are not supported`,
      );
    }

    value = descriptor.value;

    if (index < path.length - 1 && !isPlainObject(value)) {
      throw new ValidationError(
        `Cannot resolve ${notation}: "${path.slice(0, index + 1).join(".")}" is not an object`,
      );
    }
  }

  if (typeof value === "boolean") {
    return Number(value);
  }

  if (
    typeof value === "number" &&
    (namespace === "system" ? !Number.isNaN(value) : Number.isFinite(value))
  ) {
    return value;
  }

  const expectedValue =
    namespace === "system"
      ? "a number or boolean"
      : "a finite number or boolean";

  throw new ValidationError(
    `Cannot resolve ${notation}: the reference must identify ${expectedValue}`,
  );
}

function copyObject(value: object, ancestors: Set<object>): RollInputData {
  if (!isPlainObject(value) || ancestors.has(value)) {
    throw invalidData();
  }

  ancestors.add(value);
  const snapshot = Object.create(null) as Record<
    string,
    number | boolean | RollInputData
  >;

  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string" || unsafeSegments.has(key)) {
      throw invalidData();
    }

    const descriptor = Object.getOwnPropertyDescriptor(value, key);

    if (
      descriptor === undefined ||
      !descriptor.enumerable ||
      !("value" in descriptor)
    ) {
      throw invalidData();
    }

    const child: unknown = descriptor.value;
    let copied: number | boolean | RollInputData;

    if (typeof child === "boolean") {
      copied = child;
    } else if (typeof child === "number" && Number.isFinite(child)) {
      copied = child;
    } else if (isPlainObject(child)) {
      copied = copyObject(child, ancestors);
    } else {
      throw invalidData();
    }

    Object.defineProperty(snapshot, key, {
      value: copied,
      enumerable: true,
      writable: false,
      configurable: false,
    });
  }

  ancestors.delete(value);
  return Object.freeze(snapshot);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  try {
    const prototype: unknown = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  } catch {
    return false;
  }
}

function invalidData(): ValidationError {
  return new ValidationError(
    "Roll data must contain only nested plain objects, finite numbers, and booleans",
  );
}
