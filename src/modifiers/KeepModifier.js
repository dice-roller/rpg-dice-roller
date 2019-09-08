import Modifier from "./Modifier.js";

const KeepModifier = (() => {
  const _end = Symbol('end');
  const _qty = Symbol('qty');

  class KeepModifier extends Modifier{
    /**
     *
     * @param {string} notation
     * @param {string} end Either `h|l` to keep highest or lowest
     * @param {number=} qty The amount to keep
     */
    constructor(notation, end, qty){
      super(notation);

      // @todo validate that end is `h|l`
      this[_end] = end;
      // @todo validate qty
      this[_qty] = qty || 1;
    }

    get end(){
      return this[_end];
    }

    /**
     * Returns an object for JSON serialising
     *
     * @returns {{}}
     */
    toJSON(){
      const {end, qty} = this;

      return Object.assign(
        super.toJSON(),
        {
          end,
          qty
        }
      );
    }
  }

  return KeepModifier;
})();

export default KeepModifier;
