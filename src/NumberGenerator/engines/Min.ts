import { Engine } from "../../types/Interfaces/NumberGenerator/Engines/Engine";
/**
 * Engine that always returns the minimum value.
 * Used internally for calculating min roll values.
 *
 * @since 4.2.0
 *
 * @type {{next(): number}}
 */
class Min implements Engine {
  /* eslint-disable @typescript-eslint/class-methods-use-this */
  /**
   * Returns the minimum number index, `0`
   *
   * @returns {number}
   */
  next(): number {
    return 0;
  }
  /* eslint-enable @typescript-eslint/class-methods-use-this */
}

export default Min;

const engine = new Min();

export {
  engine,
}
