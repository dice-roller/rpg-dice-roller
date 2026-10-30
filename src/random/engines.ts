/**
 * Ready-made random engines (from random-js), for `new Roller({ engine })`.
 *
 * - `nativeMath`: `Math.random()` (the default)
 * - `browserCrypto` / `nodeCrypto`: cryptographically secure
 * - `MersenneTwister19937`: seedable, e.g. `MersenneTwister19937.seed(42)`
 */
export {
  MersenneTwister19937,
  browserCrypto,
  nativeMath,
  nodeCrypto,
} from "random-js";
