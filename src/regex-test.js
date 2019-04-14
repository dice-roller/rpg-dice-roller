/**
 * A JS based dice roller that uses dice notation, as described here:
 * https://en.m.wikipedia.org/wiki/Dice_notation
 *
 * @version v3.0.1
 * @author GreenImp - greenimp.co.uk
 * @link https://github.com/GreenImp/rpg-dice-roller
 */
import DiceRoller from './dice-roller.js';
import DiceRoll from './dice-roll.js';
import {diceUtils, exportFormats} from './utils.js';
import '../node_modules/xregexp/xregexp-all.js';

let notation = `3+2d4!!+(2d6+3d4)-(10d4-L+(d6*2))+2`;
//notation = '2d6>3+H+d4';

console.log('Notation:', notation);
const diceRoller = new DiceRoller();
const roll = diceRoller.roll(notation);
console.log(roll.total, roll.successes);

export { DiceRoller, DiceRoll, diceUtils, exportFormats };
