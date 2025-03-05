import { browserCrypto } from "random-js";

/**
 * An Engine that relies on the globally-available `crypto.getRandomValues`,
 * which is typically available in modern browsers.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
 *
 * @since 4.2.0
 *
 * @type {Engine}
 */
const engine = browserCrypto;

export default engine;

export {
  engine,
};
