import { nativeMath } from "random-js";

/**
 * An int32-producing Engine that uses `Math.random()`
 *
 * @type {Engine}
 */
const engine = nativeMath;

export default engine;

export {
  engine,
};
