import ComparisonModifier from './ComparisonModifier';
import DieActionValueError from '../exceptions/DieActionValueError';

const onceSymbol = Symbol('once');

class ReRollModifier extends ComparisonModifier {
  /**
   *
   * @param {string} notation
   * @param {boolean} once
   * @param {ComparePoint} comparePoint
   */
  constructor(notation, once = false, comparePoint = null) {
    super(notation, comparePoint);

    this.once = !!once;

    // set the modifier's sort order
    this.order = 4;
  }

  /**
   * Returns whether the modifier should only re-roll once or not
   *
   * @returns {boolean}
   */
  get once() {
    return !!this[onceSymbol];
  }

  /**
   * Sets whether the modifier should only re-roll once or not
   *
   * @param value
   */
  set once(value) {
    this[onceSymbol] = !!value;
  }

  /**
   * Runs the modifier on the rolls
   *
   * @param {RollResults} results
   * @param {StandardDice} _dice
   *
   * @returns {RollResults}
   */
  run(results, _dice) {
    // ensure that the dice can explode without going into an infinite loop
    if (_dice.min === _dice.max) {
      throw new DieActionValueError(_dice, 're-roll');
    }

    results.rolls
      .map((roll) => {
        // re-roll if the value matches the compare point and we haven't reached the max iterations,
        // unless we're only rolling once and have already re-rolled
        for (let i = 0; (i < this.maxIterations) && this.isComparePoint(roll.value); i++) {
          // re-roll the dice
          const rollResult = _dice.rollOnce();

          // update the roll value (Unlike exploding, the original value is not kept)
          // eslint-disable-next-line no-param-reassign
          roll.value = rollResult.value;

          // add the re-roll modifier flag
          roll.modifiers.add(`re-roll${this.once ? '-once' : ''}`);

          // stop the loop if we're only re-rolling once
          if (this.once) {
            break;
          }
        }

        return roll;
      });

    return results;
  }

  /**
   * Returns an object for JSON serialising
   *
   * @returns {{}}
   */
  toJSON() {
    const { once } = this;

    return Object.assign(
      super.toJSON(),
      {
        once,
      },
    );
  }
}

export default ReRollModifier;
