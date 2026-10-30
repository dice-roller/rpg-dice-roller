/**
 * Compile-time assertion helpers for the `*.test-d.ts` files (checked by `tsc`, not run by Jest).
 */

/** Compiles only if `value` is assignable to `T`. */
export function accepts<T>(value: T): void {
  void value;
}

/** `true` if `A` and `B` are exactly the same type. */
export type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

/** Compiles only if `T` is `true`. */
export function assertType<T extends true>(): T | undefined {
  return undefined;
}
