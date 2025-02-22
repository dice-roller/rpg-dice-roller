import { generator } from '../NumberGenerator';
import RollResult from '../results/RollResult';
import StandardDice from './StandardDice';
import {ModifierCollection} from "../types/Types/ModifierCollection";
import Description from "../Description";
import { Modifier } from "../types/Interfaces/Modifiers/Modifier";

/**
 * Represents a Fudge / Fate type die.
 *
 * @extends StandardDice
 */
class FudgeDice extends StandardDice {
  override readonly name: string = 'fudge';

  /**
   * Create a `FudgeDice` instance.
   *
   * @param {number} [nonBlanks=2] The number of sides each symbol should cover (`1` or `2`)
   * @param {number} [qty=1] The number of dice to roll (e.g. `4`)
   * @param {Map<string, Modifier>|Modifier[]|{}|null} [modifiers] The modifiers that affect the die
   * @param {Description|string|null} [description=null] The roll description.
   *
   * @throws {RangeError} nonBlanks must be 1 or 2
   * @throws {TypeError} modifiers must be valid
   */
  constructor(
    nonBlanks?: 1|2,
    qty: number = 1,
    modifiers: ModifierCollection | Modifier[] | null = null,
    description: Description|string|null = null
  ) {
    let numNonBlanks = nonBlanks;

    if (!numNonBlanks && (numNonBlanks as unknown !== 0)) {
      numNonBlanks = 2;
    } else if ((numNonBlanks !== 1) && (numNonBlanks !== 2)) {
      throw new RangeError('nonBlanks must be 1 or 2');
    }

    super(numNonBlanks, qty, modifiers, -1, 1, description);
  }

  /**
   * The number of sides that each symbol (+, -) covers.
   *
   * @returns {number} `1` or `2`
   */
  get nonBlanks(): number {
    return super.sides as number;
  }

  /**
   * The number of sides the die has.
   *
   * @returns {string} 'F.2' or 'F.1'
   */
  override get sides(): string {
    return `F.${this.nonBlanks}`;
  }

  /**
   * Roll a single die and return the value.
   *
   * @returns {RollResult} The value rolled
   */
  override rollOnce(): RollResult {
    let total = 0;

    if (this.nonBlanks === 2) {
      // default fudge (2 of each non-blank) = 1d3 - 2
      total = generator.integer(1, 3) - 2;
    } else if (this.nonBlanks === 1) {
      // only 1 of each non-blank
      // on 1d6 a roll of 1 = -1, 6 = +1, others = 0
      const num = generator.integer(1, 6);

      if (num === 1) {
        total = -1;
      } else if (num === 6) {
        total = 1;
      }
    }

    return new RollResult(total);
  }
}

export default FudgeDice;
