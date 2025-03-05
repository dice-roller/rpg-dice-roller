import { nodeCrypto } from "random-js"

/**
 * An Engine that relies on the node-available
 * `require('crypto').randomBytes`, which has been available since 0.58.
 *
 * See https://nodejs.org/api/crypto.html#crypto_crypto_randombytes_size_callback
 *
 * @type {Engine}
 */
const engine = nodeCrypto;

export default engine;

export {
  engine,
};
