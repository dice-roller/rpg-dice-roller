import { Engine } from "../../Types/Interfaces/NumberGenerator/Engines/Engine";

/**
 * Engine that always returns the minimum value.
 * Used internally for calculating min roll values.
 *
 * @since 4.2.0
 *
 * @type {{next(): number}}
 */
class Min implements Engine {
  private readonly INT32_MIN = -0x80000000;

  readonly name: string = 'min';

  /* eslint-disable @typescript-eslint/class-methods-use-this */
  clone(): Min {
    return new Min();
  }

  /**
   * Returns the minimum number index, `0`
   *
   * @returns {number}
   */
  next(): number {
    return this.INT32_MIN;

  }
  /* eslint-enable @typescript-eslint/class-methods-use-this */
}

export default Min;

const engine = new Min();

export {
  engine,
}
