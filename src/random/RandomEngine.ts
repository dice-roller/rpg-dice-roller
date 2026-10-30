/**
 * A source of randomness.
 *
 * The same shape as random-js's `Engine`, so `nativeMath`, `nodeCrypto`, `browserCrypto` and
 * `MersenneTwister19937.seed(n)` can be used directly.
 */
export interface RandomEngine {
  /** Returns a 32-bit integer. */
  next(): number;
}
