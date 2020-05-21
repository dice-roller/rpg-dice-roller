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
    this.order = 2;
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
        /* eslint-disable no-param-reassign */
        let hasReRolled = false;

        // if the die roll matches the compare point we re-roll. Unless we're only rolling once,
        // we should re-roll if any consecutive rolls also match the CP
        while (this.isComparePoint(roll.value) && (!this.once || !hasReRolled)) {
          // roll the dice
          const rollResult = _dice.rollOnce();

          // update the roll value (Unlike exploding, the original value if not kept)
          roll.value = rollResult.value;

          // increment the roll count so we only roll once when required
          hasReRolled = true;
        }

        // add the re-roll modifier flag outside the loop, otherwise we get duplicate flags
        if (hasReRolled) {
          roll.modifiers.add(`re-roll${this.once ? '-once' : ''}`);
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
